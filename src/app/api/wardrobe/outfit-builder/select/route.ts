import { NextResponse } from 'next/server'
import { generateOutfitSuggestions } from '@/lib/openai'
import { getAllWardrobeItems, getWardrobeItem } from '@/lib/db'
import { checkRateLimit } from '@/lib/rateLimit'

interface SelectRequest {
  itemId: string
  itemType: 'top' | 'bottom' | 'shoes'
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body: SelectRequest = await request.json()

    // Validate input
    if (!body.itemId || !body.itemType) {
      return NextResponse.json(
        { error: 'itemId and itemType are required' },
        { status: 400 }
      )
    }

    // Fetch the selected item from database
    const selectedItem = getWardrobeItem(body.itemId)

    if (!selectedItem) {
      return NextResponse.json(
        { error: 'Item not found in wardrobe' },
        { status: 404 }
      )
    }

    // Get all wardrobe items
    const wardrobeItems = getAllWardrobeItems()

    if (!wardrobeItems || wardrobeItems.length === 0) {
      return NextResponse.json(
        {
          success: true,
          detectedPiece: {
            type: selectedItem.item_type,
            metadata: {
              item_type: selectedItem.item_type,
              color: selectedItem.color,
              material: selectedItem.material,
              formality: selectedItem.formality,
              fit: selectedItem.fit,
              silhouette: selectedItem.silhouette,
              visual_weight: selectedItem.visual_weight,
            },
          },
          outfitSuggestions: [],
          message: 'Wardrobe needs more items to create complete outfit combinations.',
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      )
    }

    // Generate outfit suggestions with the selected item
    const metadata = {
      item_type: selectedItem.item_type,
      color: selectedItem.color,
      material: selectedItem.material,
      formality: selectedItem.formality,
      fit: selectedItem.fit,
      silhouette: selectedItem.silhouette,
      visual_weight: selectedItem.visual_weight,
    }

    const outfitSuggestions = await generateOutfitSuggestions(metadata, wardrobeItems, body.itemType, body.itemId)

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
          type: selectedItem.item_type,
          metadata,
        },
        outfitSuggestions: hydratedOutfits,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Outfit builder select error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate outfit suggestions', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
