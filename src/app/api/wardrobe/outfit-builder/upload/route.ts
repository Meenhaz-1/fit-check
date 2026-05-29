import { NextResponse } from 'next/server'
import { detectClothingItems, extractMetadata, generateOutfitSuggestions } from '@/lib/openai'
import { getAllWardrobeItems } from '@/lib/db'
import { hydrateOutfits } from '@/lib/outfit-utils'

interface OutfitBuilderRequest {
  image: string
  mediaType?: string
}

export async function POST(request: Request) {
  try {
    const body: OutfitBuilderRequest = await request.json()

    // Validate image
    if (!body.image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    const mediaType = (body.mediaType || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    // Detect clothing items in the uploaded image
    const detectedItems = await detectClothingItems(body.image, mediaType)

    if (!detectedItems || detectedItems.length === 0) {
      return NextResponse.json(
        { error: 'Could not detect clothing items in the image' },
        { status: 400 }
      )
    }

    // Extract metadata from the first detected item
    const firstItem = detectedItems[0]
    const metadataResult = await extractMetadata(body.image, firstItem, mediaType)
    const metadata = (Array.isArray(metadataResult) ? metadataResult[0] : metadataResult) as Record<string, string>

    // Get all wardrobe items
    const wardrobeItems = getAllWardrobeItems()

    if (!wardrobeItems || wardrobeItems.length === 0) {
      return NextResponse.json(
        {
          success: true,
          detectedPiece: {
            type: firstItem,
            metadata,
          },
          outfitSuggestions: [],
          message: 'No wardrobe items to create outfits with. Add items to your wardrobe first.',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      )
    }

    // Determine the piece type based on detected item
    let pieceType: 'top' | 'bottom' | 'shoes' = 'top'
    const itemLower = firstItem.toLowerCase()
    if (itemLower.includes('pant') || itemLower.includes('trouser') || itemLower.includes('jean') || itemLower.includes('skirt') || itemLower.includes('short')) {
      pieceType = 'bottom'
    } else if (itemLower.includes('shoe') || itemLower.includes('boot') || itemLower.includes('sneaker') || itemLower.includes('loafer') || itemLower.includes('sandal')) {
      pieceType = 'shoes'
    }

    // Generate outfit suggestions
    const outfitSuggestions = await generateOutfitSuggestions(metadata, wardrobeItems, pieceType)

    // Hydrate outfit suggestions with full item data from database
    const baseHydratedOutfits = hydrateOutfits(outfitSuggestions)
    const hydratedOutfits = baseHydratedOutfits.map((outfit, idx) => ({
      ...outfit,
      matchScore: outfitSuggestions[idx].matchScore,
      whyItWorks: outfitSuggestions[idx].whyItWorks,
      occasions: outfitSuggestions[idx].occasions,
      missingItems: outfitSuggestions[idx].missingItems || [],
    }))

    return NextResponse.json(
      {
        success: true,
        detectedPiece: {
          type: firstItem,
          metadata,
        },
        outfitSuggestions: hydratedOutfits,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Outfit builder upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate outfit suggestions', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
