import { NextResponse } from 'next/server'
import {
  insertProfile,
  getAllProfiles,
  getDefaultProfile,
  UserProfile,
} from '@/lib/db'
import { checkRateLimit } from '@/lib/rateLimit'

const MAX_FIELD_LENGTH = 100

interface CreateProfileRequest {
  name: string
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say'
  buildType?: string
  buildTypeConfirmed?: boolean
}

export async function GET(request: Request) {
  try {
    const profiles = getAllProfiles()
    const defaultProfile = getDefaultProfile()

    return NextResponse.json({
      profiles,
      defaultProfile,
      total: profiles.length,
    })
  } catch (error) {
    console.error('Failed to fetch profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body: CreateProfileRequest = await request.json()

    // Validation
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (body.name.trim().length === 0 || body.name.length > MAX_FIELD_LENGTH) {
      return NextResponse.json(
        { error: 'Name must be 1-100 characters' },
        { status: 400 },
      )
    }

    const validGenders = [
      'male',
      'female',
      'non-binary',
      'prefer-not-to-say',
      undefined,
    ]
    if (!validGenders.includes(body.gender)) {
      return NextResponse.json({ error: 'Invalid gender' }, { status: 400 })
    }

    const validBuildTypes = [
      'hourglass',
      'pear',
      'apple',
      'rectangle',
      'inverted-triangle',
      undefined,
    ]
    if (!validBuildTypes.includes(body.buildType)) {
      return NextResponse.json(
        { error: 'Invalid body type' },
        { status: 400 },
      )
    }

    // Create profile
    const existingProfiles = getAllProfiles()
    const isFirst = existingProfiles.length === 0

    const profile: UserProfile = {
      id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: body.name.trim(),
      gender: body.gender as 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | undefined,
      buildType: body.buildType as 'hourglass' | 'pear' | 'apple' | 'rectangle' | 'inverted-triangle' | undefined,
      buildTypeConfirmed: body.buildTypeConfirmed ?? false,
      isDefault: isFirst, // First profile is default
      colorPalettes: {
        aiSuggested: [],
        userSelected: undefined,
      },
      aesthetics: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const created = await insertProfile(profile)
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Failed to create profile:', error)
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 },
    )
  }
}
