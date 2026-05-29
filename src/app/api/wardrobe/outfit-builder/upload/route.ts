import { NextResponse } from 'next/server'
import { detectClothingItems, extractMetadata, generateOutfitSuggestions } from '@/lib/openai'
import { getAllWardrobeItems, getWardrobeItem } from '@/lib/db'
import { checkRateLimit } from '@/lib/rateLimit'

interface OutfitBuilderRequest {
  image: string
  mediaType?: string
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body: OutfitBuilderRequest = await request.json()

    // Validate image
    if (!body.image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 })
    }

    const mediaType = body.mediaType || 'image/jpeg'

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
    const metadata = await extractMetadata(body.image, firstItem, mediaType)

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
    const hydratedOutfits = outfitSuggestions.map((outfit: any, idx: number) => {
      const topItem = getWardrobeItem(outfit.topId)
      const bottomItem = getWardrobeItem(outfit.bottomId)
      const shoesItem = getWardrobeItem(outfit.shoesId)
      const outerwearItem = outfit.outerwearId ? getWardrobeItem(outfit.outerwearId) : null
      const accessoryItem = outfit.accessoryId ? getWardrobeItem(outfit.accessoryId) : null

      return {
        id: idx + 1,
        top: topItem ? {
          id: topItem.id,
          item_type: topItem.item_type,
          color: topItem.color,
          material: topItem.material,
          visual_weight: topItem.visual_weight,
          imageUrl: topItem.imageUrl,
        } : null,
        bottom: bottomItem ? {
          id: bottomItem.id,
          item_type: bottomItem.item_type,
          color: bottomItem.color,
          material: bottomItem.material,
          visual_weight: bottomItem.visual_weight,
          imageUrl: bottomItem.imageUrl,
        } : null,
        shoes: shoesItem ? {
          id: shoesItem.id,
          item_type: shoesItem.item_type,
          color: shoesItem.color,
          material: shoesItem.material,
          visual_weight: shoesItem.visual_weight,
          imageUrl: shoesItem.imageUrl,
        } : null,
        outerwear: outerwearItem ? {
          id: outerwearItem.id,
          item_type: outerwearItem.item_type,
          color: outerwearItem.color,
          material: outerwearItem.material,
          visual_weight: outerwearItem.visual_weight,
          imageUrl: outerwearItem.imageUrl,
        } : null,
        accessory: accessoryItem ? {
          id: accessoryItem.id,
          item_type: accessoryItem.item_type,
          color: accessoryItem.color,
          material: accessoryItem.material,
          visual_weight: accessoryItem.visual_weight,
          imageUrl: accessoryItem.imageUrl,
        } : null,
        matchScore: outfit.matchScore,
        whyItWorks: outfit.whyItWorks,
        occasions: outfit.occasions,
        missingItems: outfit.missingItems || [],
      }
    })

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
