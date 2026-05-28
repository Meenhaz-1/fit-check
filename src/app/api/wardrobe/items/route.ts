import { NextResponse } from 'next/server'
import { getAllWardrobeItems } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const items = getAllWardrobeItems()

    return NextResponse.json(
      { success: true, items, count: items.length, timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch items', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
