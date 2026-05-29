import { NextResponse } from 'next/server'

const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
const BASE64_PREFIX_RE = /^[A-Za-z0-9+/]+=*$/
const MAX_IMAGE_SIZE = 30_000_000

type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number]

export interface ValidationResult {
  success: boolean
  error?: string
  mediaType?: AllowedMediaType
  base64?: string
}

export function extractIP(request: Request): string {
  return request.headers.get('x-forwarded-for') ?? 'unknown'
}

export function getBase64(imageData: string): string {
  if (imageData.startsWith('data:')) {
    return imageData.split(',')[1] || ''
  }
  return imageData
}

export function validateImageInput(imageData: string, mediaType?: string): ValidationResult {
  if (!imageData || typeof imageData !== 'string') {
    return { success: false, error: 'No image data provided' }
  }

  if (imageData.length > MAX_IMAGE_SIZE) {
    return { success: false, error: 'Image too large' }
  }

  const rawBase64 = getBase64(imageData)
  if (!BASE64_PREFIX_RE.test(rawBase64.slice(0, 500))) {
    return { success: false, error: 'Invalid image data' }
  }

  const rawType = mediaType ?? 'image/jpeg'
  if (!ALLOWED_MEDIA_TYPES.includes(rawType as AllowedMediaType)) {
    return { success: false, error: 'Invalid media type' }
  }

  return {
    success: true,
    mediaType: rawType as AllowedMediaType,
    base64: rawBase64,
  }
}

export function cleanAndParseJSON<T = Record<string, unknown>>(content: string): T {
  let jsonContent = content.trim()

  if (jsonContent.startsWith('```json')) {
    jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
  } else if (jsonContent.startsWith('```')) {
    jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }

  return JSON.parse(jsonContent) as T
}

export function createErrorResponse(error: string, status: number = 400) {
  return NextResponse.json(
    { success: false, error, timestamp: new Date().toISOString() },
    { status }
  )
}

export function createSuccessResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    { success: true, ...data, timestamp: new Date().toISOString() },
    { status }
  )
}
