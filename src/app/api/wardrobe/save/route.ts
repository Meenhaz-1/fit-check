import { NextResponse } from 'next/server'
import { basename } from 'path'
import { insertWardrobeItem } from '@/lib/db'
import { checkRateLimit } from '@/lib/rateLimit'

const MAX_FIELD_LENGTH = 200

interface SaveRequest {
  filename: string
  item_type: string
  color: string
  material: string
  formality: string
  fit: string
  silhouette: string
  visual_weight: string
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body: SaveRequest = await request.json()

    const requiredFields: (keyof SaveRequest)[] = [
      'filename', 'item_type', 'color', 'material', 'formality', 'fit', 'silhouette', 'visual_weight',
    ]
    for (const field of requiredFields) {
      const val = body[field]
      if (!val || typeof val !== 'string' || val.trim() === '' || val.length > MAX_FIELD_LENGTH) {
        return NextResponse.json({ error: `Invalid field: ${field}` }, { status: 400 })
      }
    }

    const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const safeFilename = basename(body.filename).replace(/[^a-zA-Z0-9._-]/g, '_')

    const item = insertWardrobeItem({
      id,
      filename: safeFilename,
      item_type: body.item_type.trim(),
      color: body.color.trim(),
      material: body.material.trim(),
      formality: body.formality.trim(),
      fit: body.fit.trim(),
      silhouette: body.silhouette.trim(),
      visual_weight: body.visual_weight.trim(),
      uploaded_at: new Date().toISOString(),
    })

    return NextResponse.json(
      { success: true, item, timestamp: new Date().toISOString() },
      { status: 200 }
    )
  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save item', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
