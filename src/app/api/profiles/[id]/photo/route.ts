import { NextResponse } from 'next/server'
import { basename, join } from 'path'
import { writeFileSync, mkdirSync } from 'fs'
import { getProfile, updateProfile } from '@/lib/db'
import { checkRateLimit } from '@/lib/rateLimit'
import { validateImageInput } from '@/lib/validation'

interface PhotoUploadRequest {
  image: string
  mediaType?: string
  skinAnalysis?: {
    skinTone: string
    undertone: string
    confidence: number
  }
  buildType?: string
  buildTypeConfirmed?: boolean
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { id } = await params
    const profile = getProfile(id)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body: PhotoUploadRequest = await request.json()

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

    // Determine file extension
    let ext = 'jpg'
    if (body.mediaType) {
      if (body.mediaType.includes('png')) ext = 'png'
      else if (body.mediaType.includes('gif')) ext = 'gif'
      else if (body.mediaType.includes('webp')) ext = 'webp'
    }

    // Save image file
    const imagesDir = join(process.cwd(), 'public', 'profile-photos')
    mkdirSync(imagesDir, { recursive: true })

    const filename = `profile_${id}.${ext}`
    const filepath = join(imagesDir, filename)
    const buffer = Buffer.from(base64, 'base64')
    writeFileSync(filepath, buffer)

    const photoUrl = `/profile-photos/${filename}`

    // Update profile with new photo and optional analysis
    const updates: any = { photoUrl }

    if (body.skinAnalysis) {
      updates.skinAnalysis = body.skinAnalysis
    }

    if (body.buildType) {
      updates.buildType = body.buildType
    }

    if (body.buildTypeConfirmed !== undefined) {
      updates.buildTypeConfirmed = body.buildTypeConfirmed
    }

    const updated = await updateProfile(id, updates)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to upload profile photo:', error)
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 },
    )
  }
}
