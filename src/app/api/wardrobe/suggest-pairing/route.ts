import { NextResponse } from 'next/server'
import { detectClothingItems, extractMetadata, suggestPairings } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rateLimit'
import { getAllWardrobeItems } from '@/lib/db'

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number]

const BASE64_PREFIX_RE = /^[A-Za-z0-9+/]+=*$/
const MAX_IMAGE_SIZE = 30_000_000

interface SuggestPairingRequest {
  image: string
  mediaType?: string
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body: SuggestPairingRequest = await request.json()

    if (!body.image || typeof body.image !== 'string') {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 })
    }

    if (body.image.length > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 })
    }

    const rawBase64 = body.image.startsWith('data:') ? (body.image.split(',')[1] ?? '') : body.image
    if (!BASE64_PREFIX_RE.test(rawBase64.slice(0, 500))) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 })
    }

    const rawType = body.mediaType ?? 'image/jpeg'
    if (!ALLOWED_MEDIA_TYPES.includes(rawType as AllowedMediaType)) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 })
    }
    const mediaType = rawType as AllowedMediaType

    // Step 1: Detect what the uploaded item is
    const detectedItems = await detectClothingItems(body.image, mediaType)
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

    // Step 5: Sort by match score and return
    const sortedSuggestions = suggestions.sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json(
      {
        success: true,
        uploadedItem: {
          detected_type: selectedItem,
          ...itemMetadata,
        },
        suggestions: sortedSuggestions,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Pairing suggestion error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to suggest pairings',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
