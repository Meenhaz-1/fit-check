import { NextResponse } from 'next/server'
import { detectClothingItems } from '@/lib/openai'
import { validateImageInput, createErrorResponse, createSuccessResponse } from '@/lib/validation'

interface DetectRequest {
  image: string
  mediaType?: string
}

export async function POST(request: Request) {
  try {
    const body: DetectRequest = await request.json()

    const validation = validateImageInput(body.image, body.mediaType)
    if (!validation.success) {
      const status = body.image?.length > 30_000_000 ? 413 : 400
      return createErrorResponse(validation.error!, status)
    }

    const items = await detectClothingItems(body.image, validation.mediaType!)

    return createSuccessResponse({ items })
  } catch (error) {
    console.error('Detection error:', error)
    return createErrorResponse('Failed to detect items', 500)
  }
}
