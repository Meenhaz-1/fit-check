import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'
import { validateImageInput } from '@/lib/validation'
import { analyzePhotoAndGeneratePalette } from '@/lib/openai-profile-analysis'

interface AnalyzePhotoRequest {
  image: string
  mediaType?: string
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body: AnalyzePhotoRequest = await request.json()

    if (!body.image) {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 })
    }

    // Validate image
    const imageValidation = validateImageInput(body.image, body.mediaType)
    if (!imageValidation.success) {
      return NextResponse.json(
        { error: imageValidation.error || 'Invalid image' },
        { status: 400 },
      )
    }

    // Extract base64 (remove data URL prefix if present)
    let base64 = body.image
    if (base64.includes(',')) {
      base64 = base64.split(',')[1]
    }

    // Analyze photo
    const analysis = await analyzePhotoAndGeneratePalette(base64)

    return NextResponse.json({
      skinAnalysis: analysis.skinAnalysis,
      suggestedBodyShape: analysis.suggestedBodyShape,
      suggestedColors: analysis.suggestedColors,
    })
  } catch (error) {
    console.error('Failed to analyze photo:', error)
    return NextResponse.json(
      { error: 'Failed to analyze photo: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 },
    )
  }
}
