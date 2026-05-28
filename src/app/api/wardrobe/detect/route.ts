import { NextResponse } from 'next/server'
import { detectClothingItems } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rateLimit'

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number]

const BASE64_PREFIX_RE = /^[A-Za-z0-9+/]+=*$/
const MAX_IMAGE_SIZE = 30_000_000

interface DetectRequest {
  image: string
  mediaType?: string
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body: DetectRequest = await request.json()

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

    const items = await detectClothingItems(body.image, mediaType)

    return NextResponse.json(
      { success: true, items, timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch (error) {
    console.error('Detection error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to detect items', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
