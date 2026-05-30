import { NextResponse } from 'next/server'
import { getDefaultProfile, setDefaultProfile } from '@/lib/db'
import { checkRateLimit } from '@/lib/rateLimit'

interface SetDefaultRequest {
  profileId: string
}

export async function GET(request: Request) {
  try {
    const defaultProfile = getDefaultProfile()

    if (!defaultProfile) {
      return NextResponse.json(
        { error: 'No default profile set' },
        { status: 404 },
      )
    }

    return NextResponse.json(defaultProfile)
  } catch (error) {
    console.error('Failed to fetch default profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch default profile' },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body: SetDefaultRequest = await request.json()

    if (!body.profileId) {
      return NextResponse.json(
        { error: 'profileId is required' },
        { status: 400 },
      )
    }

    const success = await setDefaultProfile(body.profileId)
    if (!success) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const defaultProfile = getDefaultProfile()
    return NextResponse.json(defaultProfile)
  } catch (error) {
    console.error('Failed to set default profile:', error)
    return NextResponse.json(
      { error: 'Failed to set default profile' },
      { status: 500 },
    )
  }
}
