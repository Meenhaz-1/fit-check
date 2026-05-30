import { NextResponse } from 'next/server'
import { extractMetadata, evaluateOutfit } from '@/lib/openai'
import { validateImageInput, createErrorResponse, createSuccessResponse } from '@/lib/validation'
import { insertEvaluation } from '@/lib/db'

interface EvaluateRequest {
  image: string
  mediaType?: string
  selectedItems: string[]
  persona?: string
  profile?: {
    id: string
    name: string
    gender?: string
    buildType?: string
    skinAnalysis?: {
      skinTone: string
      undertone: string
      confidence: number
    }
    colorPalettes?: {
      aiSuggested?: string[]
      userSelected?: string
    }
    aesthetics?: string[]
    formality?: string
    paletteAffinity?: string
  }
  profilePhoto?: string
  feedback?: string
}

export async function POST(request: Request) {
  try {
    const body: EvaluateRequest = await request.json()

    if (!body.selectedItems || body.selectedItems.length === 0) {
      return createErrorResponse('No items selected for evaluation', 400)
    }

    const validation = validateImageInput(body.image, body.mediaType)
    if (!validation.success) {
      const status = body.image?.length > 30_000_000 ? 413 : 400
      return createErrorResponse(validation.error!, status)
    }

    console.log(`[evaluate] Evaluating ${body.selectedItems.length} selected items`)
    console.log(`[evaluate] Profile received: ${body.profile ? body.profile.name : 'NONE'}`)
    console.log(`[evaluate] Profile photo URL: ${body.profilePhoto || 'NONE'}`)

    // Extract metadata for all selected items in one efficient call
    const metadataArray = (await extractMetadata(body.image, body.selectedItems, validation.mediaType!)) as Record<
      string,
      string
    >[]

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

    // Get comprehensive evaluation with persona and optional profile
    const evaluation = await evaluateOutfit(
      itemsWithMetadata,
      body.persona || 'minimalist',
      body.profile
    )

    // Log profile and feedback info if provided
    if (body.profilePhoto) {
      console.log(`[evaluate] Profile photo provided: ${body.profile?.name || 'Unknown profile'}`)
    }
    if (body.feedback) {
      console.log(`[evaluate] User feedback received: ${body.feedback.substring(0, 50)}...`)
    }

    // Save evaluation to database
    const evaluationRecord = {
      id: `eval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      item_filename: body.selectedItems.join(', '),
      verdict: (evaluation.verdict as 'Buy' | 'Maybe' | 'Do Not Buy') || 'Maybe',
      reasoning: evaluation.verdictReasoning || 'Comprehensive outfit evaluation provided',
      pairings: undefined,
      created_at: new Date().toISOString(),
      profile_id: body.profile?.id,
      user_feedback: body.feedback,
    }

    await insertEvaluation(evaluationRecord as any)
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
