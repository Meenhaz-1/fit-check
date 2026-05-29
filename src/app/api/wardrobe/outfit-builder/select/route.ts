import { NextResponse } from 'next/server'
import { generateOutfitSuggestions } from '@/lib/openai'
import { getAllWardrobeItems, getWardrobeItem } from '@/lib/db'
import { hydrateOutfits } from '@/lib/outfit-utils'
import { outfitCache } from '@/lib/cache'

interface SelectRequest {
  itemId: string
  itemType: 'top' | 'bottom' | 'shoes'
}

// Convert database item_type to category
function getItemCategory(itemType: string): 'top' | 'bottom' | 'shoes' | 'other' {
  const lower = (itemType || '').toLowerCase()

  if (lower.includes('pant') || lower.includes('trouser') || lower.includes('jean') ||
      lower.includes('skirt') || lower.includes('short') || lower.includes('legging')) {
    return 'bottom'
  } else if (lower.includes('shoe') || lower.includes('boot') || lower.includes('sneaker') ||
             lower.includes('loafer') || lower.includes('sandal') || lower.includes('pump') ||
             lower.includes('heel')) {
    return 'shoes'
  } else if (lower.includes('shirt') || lower.includes('top') || lower.includes('blouse') ||
             lower.includes('jacket') || lower.includes('sweater') || lower.includes('cardigan') ||
             lower.includes('vest') || lower.includes('coat') || lower.includes('dress')) {
    return 'top'
  }

  return 'other'
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
    const allWardrobeItems = getAllWardrobeItems()
    console.timeEnd('Fetch wardrobe items')

    // Filter: exclude items of the same category (no point suggesting another shirt if looking for shirt pairings)
    console.time('Filter complementary items')
    const wardrobeItems = allWardrobeItems.filter((item) => {
      const itemCategory = getItemCategory(item.item_type as string)
      return itemCategory !== body.itemType && item.id !== body.itemId
    })
    console.timeEnd('Filter complementary items')

    console.log(`[outfit-builder/select] Filtered from ${allWardrobeItems.length} to ${wardrobeItems.length} complementary items`)

    // Check cache first
    const cacheKey = `${body.itemId}:${body.itemType}`
    const cachedSuggestions = outfitCache.get(cacheKey)
    if (cachedSuggestions) {
      console.log(`[outfit-builder/select] Cache HIT for ${cacheKey}`)
      const baseHydratedOutfits = hydrateOutfits(cachedSuggestions)
      const hydratedOutfits = baseHydratedOutfits.map((outfit, idx) => ({
        ...outfit,
        matchScore: cachedSuggestions[idx].matchScore,
        whyItWorks: cachedSuggestions[idx].whyItWorks,
        occasions: cachedSuggestions[idx].occasions,
        missingItems: cachedSuggestions[idx].missingItems || [],
      }))

      const totalTime = performance.now() - startTime
      console.log(`[outfit-builder/select] Cache lookup time: ${totalTime.toFixed(2)}ms`)

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
          outfitSuggestions: hydratedOutfits,
          timestamp: new Date().toISOString(),
          cached: true,
        },
        { status: 200 }
      )
    }

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

    // Cache the results
    console.log(`[outfit-builder/select] Caching results for ${cacheKey}`)
    outfitCache.set(cacheKey, outfitSuggestions)

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
        cached: false,
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
