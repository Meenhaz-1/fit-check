import { NextResponse } from 'next/server'
import { getAllWardrobeItems, deleteWardrobeItem } from '@/lib/db'

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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('id')

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }

    const deleted = await deleteWardrobeItem(itemId)

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Item not found', timestamp: new Date().toISOString() },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Item deleted', timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete item', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
