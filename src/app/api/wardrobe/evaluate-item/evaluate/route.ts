import { NextResponse } from 'next/server'
import { extractMetadataForMultipleItems, evaluateOutfit } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rateLimit'
import { insertEvaluation } from '@/lib/db'

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number]

const BASE64_PREFIX_RE = /^[A-Za-z0-9+/]+=*$/
const MAX_IMAGE_SIZE = 30_000_000

interface EvaluateRequest {
  image: string
  mediaType?: string
  selectedItems: string[]
  persona?: string
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body: EvaluateRequest = await request.json()

    if (!body.image || typeof body.image !== 'string') {
      return NextResponse.json({ error: 'No image data provided' }, { status: 400 })
    }

    if (!body.selectedItems || body.selectedItems.length === 0) {
      return NextResponse.json({ error: 'No items selected for evaluation' }, { status: 400 })
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

    console.log(`[evaluate] Evaluating ${body.selectedItems.length} selected items`)

    // Extract metadata for all selected items in one efficient call
    const metadataArray = await extractMetadataForMultipleItems(body.image, body.selectedItems, mediaType)

    const itemsWithMetadata = body.selectedItems.map((itemName, idx) => {
      const metadata = metadataArray[idx] || {}
      return {
        type: itemName,
        color: metadata.color || 'unknown',
        material: metadata.material || 'unknown',
        formality: metadata.formality || 'casual',
        fit: metadata.fit || 'regular',
        silhouette: metadata.silhouette || 'straight',
        visual_weight: metadata.visual_weight || 'medium',
      }
    })

    console.log(`[evaluate] Extracted metadata for ${itemsWithMetadata.length} items in single GPT call`)

    // Get comprehensive evaluation with persona
    const evaluation = await evaluateOutfit(itemsWithMetadata, body.persona || 'minimalist')

    // Save evaluation to database
    const evaluationRecord = {
      id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      item_filename: body.selectedItems.join(', '),
      verdict: (evaluation.verdict as 'Buy' | 'Maybe' | 'Do Not Buy') || 'Maybe',
      reasoning: evaluation.verdictReasoning || 'Comprehensive outfit evaluation provided',
      pairings: undefined,
      created_at: new Date().toISOString(),
    }

    insertEvaluation(evaluationRecord as any)
    console.log(`[evaluate] Saved evaluation: ${evaluationRecord.id}`)

    return NextResponse.json(
      {
        success: true,
        detectedItems: body.selectedItems,
        evaluation: evaluation,
        evaluationId: evaluationRecord.id,
        persona: body.persona || 'minimalist',
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
