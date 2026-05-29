import { NextResponse } from 'next/server'
import { detectClothingItems, extractMetadata, evaluateOutfit } from '@/lib/openai'
import { insertEvaluation } from '@/lib/db'

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number]

const BASE64_PREFIX_RE = /^[A-Za-z0-9+/]+=*$/
const MAX_IMAGE_SIZE = 30_000_000

interface EvaluateItemRequest {
  image: string
  mediaType?: string
}

export async function POST(request: Request) {
  try {
    const body: EvaluateItemRequest = await request.json()

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

    // Step 1: Detect all clothing items in the outfit
    const detectedItems = await detectClothingItems(body.image, mediaType)
    if (detectedItems.length === 0) {
      return NextResponse.json(
        { error: 'Could not detect clothing items in image' },
        { status: 400 }
      )
    }

    console.log(`[evaluateItem] Detected ${detectedItems.length} items:`, detectedItems)

    // Step 2: Extract detailed metadata for each item
    const itemsWithMetadata = await Promise.all(
      detectedItems.map(async (itemName) => {
        const metadata = await extractMetadata(body.image, itemName, mediaType)
        const itemMetadata = (Array.isArray(metadata) ? metadata[0] : metadata) as Record<string, string>
        return {
          type: itemName,
          color: itemMetadata.color || 'unknown',
          material: itemMetadata.material || 'unknown',
          formality: itemMetadata.formality || 'casual',
          fit: itemMetadata.fit || 'regular',
          silhouette: itemMetadata.silhouette || 'straight',
          visual_weight: itemMetadata.visual_weight || 'medium',
        }
      })
    )

    console.log(`[evaluateItem] Extracted metadata for ${itemsWithMetadata.length} items`)

    // Step 3: Get comprehensive evaluation
    const evaluation = await evaluateOutfit(itemsWithMetadata)

    // Step 4: Save evaluation to database
    const evaluationRecord = {
      id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      item_filename: detectedItems.join(', '),
      verdict: (evaluation.verdict as 'Buy' | 'Maybe' | 'Do Not Buy') || 'Maybe',
      reasoning: evaluation.verdictReasoning || 'Comprehensive outfit evaluation provided',
      pairings: undefined, // Store as empty for Phase 1c; could expand later
      created_at: new Date().toISOString(),
    }

    await insertEvaluation(evaluationRecord as any)
    console.log(`[evaluateItem] Saved evaluation: ${evaluationRecord.id}`)

    return NextResponse.json(
      {
        success: true,
        detectedItems: detectedItems,
        evaluation: evaluation,
        evaluationId: evaluationRecord.id,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Item evaluation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to evaluate outfit',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
