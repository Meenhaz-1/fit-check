import { NextResponse } from 'next/server'
import {
  getProfile,
  updateProfile,
  deleteProfile,
  UserProfile,
} from '@/lib/db'
import { checkRateLimit } from '@/lib/rateLimit'

const MAX_FIELD_LENGTH = 100

interface UpdateProfileRequest {
  name?: string
  gender?: string
  buildType?: string
  buildTypeConfirmed?: boolean
  skinAnalysis?: any
  aesthetics?: string[]
  formality?: string
  paletteAffinity?: string
  colorPalettes?: {
    aiSuggested?: string[]
    userSelected?: string
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const profile = getProfile(id)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 },
    )
  }
}

export async function PUT(
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

    const body: UpdateProfileRequest = await request.json()

    // Validate updates
    const updates: Partial<UserProfile> = {}

    if (body.name !== undefined) {
      if (!body.name || body.name.length > MAX_FIELD_LENGTH) {
        return NextResponse.json(
          { error: 'Name must be 1-100 characters' },
          { status: 400 },
        )
      }
      updates.name = body.name.trim()
    }

    if (body.gender !== undefined) {
      const validGenders = [
        'male',
        'female',
        'non-binary',
        'prefer-not-to-say',
        null,
      ]
      if (!validGenders.includes(body.gender)) {
        return NextResponse.json({ error: 'Invalid gender' }, { status: 400 })
      }
      updates.gender = body.gender as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | undefined
    }

    if (body.buildType !== undefined) {
      const validBuildTypes = [
        'hourglass',
        'pear',
        'apple',
        'rectangle',
        'inverted-triangle',
        null,
      ]
      if (!validBuildTypes.includes(body.buildType)) {
        return NextResponse.json(
          { error: 'Invalid body type' },
          { status: 400 },
        )
      }
      updates.buildType = body.buildType as 'hourglass' | 'pear' | 'apple' | 'rectangle' | 'inverted-triangle' | undefined
    }

    if (body.buildTypeConfirmed !== undefined) {
      updates.buildTypeConfirmed = body.buildTypeConfirmed
    }

    if (body.skinAnalysis !== undefined) {
      updates.skinAnalysis = body.skinAnalysis
    }

    if (body.aesthetics !== undefined) {
      if (!Array.isArray(body.aesthetics)) {
        return NextResponse.json(
          { error: 'Aesthetics must be an array' },
          { status: 400 },
        )
      }
      updates.aesthetics = body.aesthetics.slice(0, 4) // Max 4
    }

    if (body.formality !== undefined) {
      updates.formality = body.formality
    }

    if (body.paletteAffinity !== undefined) {
      updates.paletteAffinity = body.paletteAffinity
    }

    if (body.colorPalettes !== undefined) {
      updates.colorPalettes = body.colorPalettes
    }

    const updated = await updateProfile(id, updates)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 },
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { id } = await params
    const profile = getProfile(id)
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    await deleteProfile(id)
    return NextResponse.json({ success: true, message: 'Profile deleted' })
  } catch (error) {
    console.error('Failed to delete profile:', error)
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 },
    )
  }
}
