import { NextResponse } from 'next/server'
import { detectClothingItems, extractMetadata, suggestPairings, analyzePairingDetailed } from '@/lib/openai'
import { validateImageInput, createErrorResponse, createSuccessResponse } from '@/lib/validation'
import { getAllWardrobeItems } from '@/lib/db'

interface SuggestPairingRequest {
  image: string
  mediaType?: string
}

export async function POST(request: Request) {
  try {
    const body: SuggestPairingRequest = await request.json()

    const validation = validateImageInput(body.image, body.mediaType)
    if (!validation.success) {
      const status = body.image?.length > 30_000_000 ? 413 : 400
      return createErrorResponse(validation.error!, status)
    }

    // Step 1: Detect what the uploaded item is
    const detectedItems = await detectClothingItems(body.image, validation.mediaType!)
    if (detectedItems.length === 0) {
      return NextResponse.json(
        { error: 'Could not detect clothing item in image' },
        { status: 400 }
      )
    }

    const selectedItem = detectedItems[0]

    // Step 2: Extract detailed metadata from the uploaded item
    const itemMetadata = await extractMetadata(body.image, selectedItem, mediaType)

    // Step 3: Get all wardrobe items
    const wardrobeItems = getAllWardrobeItems()

    // Step 4: Get pairing suggestions
    const suggestions = await suggestPairings(itemMetadata, wardrobeItems as any)

    // Step 5: Enhance each suggestion with detailed analysis
    const enhancedSuggestions = await Promise.all(
      suggestions.map(async (suggestion) => {
        try {
          const detailedAnalysis = await analyzePairingDetailed(itemMetadata, suggestion.item)
          return {
            item: suggestion.item,
            reason: suggestion.reason,
            matchScore: detailedAnalysis.matchScore,
            whatWorksWell: detailedAnalysis.whatWorksWell,
            whatCouldImprove: detailedAnalysis.whatCouldImprove,
            stylingTips: detailedAnalysis.stylingTips,
          }
        } catch (error) {
          console.error('Error getting detailed analysis for suggestion:', error)
          // Return basic suggestion if detailed analysis fails
          return {
            item: suggestion.item,
            reason: suggestion.reason,
            matchScore: suggestion.matchScore,
            whatWorksWell: [],
            whatCouldImprove: [],
            stylingTips: [],
          }
        }
      })
    )

    // Step 6: Sort by match score and return
    const sortedSuggestions = enhancedSuggestions.sort((a, b) => b.matchScore - a.matchScore)

    return createSuccessResponse({
      uploadedItem: {
        detected_type: selectedItem,
        ...itemMetadata,
      },
      suggestions: sortedSuggestions,
    })
  } catch (error) {
    console.error('Pairing suggestion error:', error)
    return createErrorResponse('Failed to suggest pairings', 500)
  }
}
