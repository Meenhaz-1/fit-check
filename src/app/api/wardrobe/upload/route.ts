import { NextResponse } from 'next/server'
import { extractMetadata } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rateLimit'

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number]

const ITEM_DESCRIPTION_RE = /^[a-zA-Z0-9 \-]{1,80}$/
const BASE64_PREFIX_RE = /^[A-Za-z0-9+/]+=*$/
const MAX_IMAGE_SIZE = 30_000_000 // ~30 MB base64 ≈ ~22 MB image

interface UploadRequest {
  image: string
  mediaType?: string
  itemDescription?: string
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body: UploadRequest = await request.json()

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

    const itemDescription =
      body.itemDescription && ITEM_DESCRIPTION_RE.test(body.itemDescription)
        ? body.itemDescription
        : 'clothing item'

    const metadata = await extractMetadata(body.image, itemDescription, mediaType)

    return NextResponse.json(
      { success: true, metadata, timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to extract metadata', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
