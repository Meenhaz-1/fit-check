import { NextResponse } from 'next/server'
import { generateOutfitSuggestions } from '@/lib/openai'
import { getAllWardrobeItems, getWardrobeItem } from '@/lib/db'
import { hydrateOutfits } from '@/lib/outfit-utils'

interface SelectRequest {
  itemId: string
  itemType: 'top' | 'bottom' | 'shoes'
}

export async function POST(request: Request) {
  const startTime = performance.now()
  console.log('[outfit-builder/select] Request started')

  try {
    console.time('Parse request')
    const body: SelectRequest = await request.json()
    console.timeEnd('Parse request')

    // Validate input
    if (!body.itemId || !body.itemType) {
      return NextResponse.json(
        { error: 'itemId and itemType are required' },
        { status: 400 }
      )
    }

    // Fetch the selected item from database
    console.time('Fetch selected item')
    const selectedItem = getWardrobeItem(body.itemId)
    console.timeEnd('Fetch selected item')

    if (!selectedItem) {
      return NextResponse.json(
        { error: 'Item not found in wardrobe' },
        { status: 404 }
      )
    }

    // Get all wardrobe items
    console.time('Fetch wardrobe items')
    const wardrobeItems = getAllWardrobeItems()
    console.timeEnd('Fetch wardrobe items')

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

    console.time('Generate outfit suggestions (OpenAI API call)')
    const outfitSuggestions = await generateOutfitSuggestions(metadata, wardrobeItems, body.itemType, body.itemId)
    console.timeEnd('Generate outfit suggestions (OpenAI API call)')

    // Hydrate outfit suggestions with full item data from database
    console.time('Hydrate outfits')
    const baseHydratedOutfits = hydrateOutfits(outfitSuggestions)
    const hydratedOutfits = baseHydratedOutfits.map((outfit, idx) => ({
      ...outfit,
      matchScore: outfitSuggestions[idx].matchScore,
      whyItWorks: outfitSuggestions[idx].whyItWorks,
      occasions: outfitSuggestions[idx].occasions,
      missingItems: outfitSuggestions[idx].missingItems || [],
    }))
    console.timeEnd('Hydrate outfits')

    const totalTime = performance.now() - startTime
    console.log(`[outfit-builder/select] Total time: ${totalTime.toFixed(2)}ms`)

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
    const totalTime = performance.now() - startTime
    console.log(`[outfit-builder/select] Failed after ${totalTime.toFixed(2)}ms`)
    console.error('Outfit builder select error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate outfit suggestions', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
