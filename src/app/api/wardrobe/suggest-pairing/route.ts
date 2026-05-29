import { NextResponse } from 'next/server'
import { detectClothingItems, extractMetadata, suggestPairings } from '@/lib/openai'
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

    // Step 4: Get pairing suggestions with integrated detailed analysis (single GPT call)
    const suggestions = await suggestPairings(itemMetadata, wardrobeItems as any, true)

    // Step 5: Sort by match score and return
    const sortedSuggestions = suggestions.sort((a, b) => b.matchScore - a.matchScore)

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
