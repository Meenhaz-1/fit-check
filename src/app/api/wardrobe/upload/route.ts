import { NextResponse } from 'next/server'
import { extractMetadata } from '@/lib/openai'
import { validateImageInput, createErrorResponse, createSuccessResponse } from '@/lib/validation'

const ITEM_DESCRIPTION_RE = /^[a-zA-Z0-9 \-]{1,80}$/

interface UploadRequest {
  image: string
  mediaType?: string
  itemDescription?: string
}

export async function POST(request: Request) {
  try {
    const body: UploadRequest = await request.json()

    const validation = validateImageInput(body.image, body.mediaType)
    if (!validation.success) {
      const status = body.image?.length > 30_000_000 ? 413 : 400
      return createErrorResponse(validation.error!, status)
    }

    const itemDescription =
      body.itemDescription && ITEM_DESCRIPTION_RE.test(body.itemDescription)
        ? body.itemDescription
        : 'clothing item'

    const metadata = await extractMetadata(body.image, itemDescription, validation.mediaType!)

    return createSuccessResponse({ metadata })
  } catch (error) {
    console.error('Upload error:', error)
    return createErrorResponse('Failed to extract metadata', 500)
      { status: 500 }
    )
  }
}
