import { NextResponse } from 'next/server'
import { basename, join } from 'path'
import { writeFileSync, mkdirSync } from 'fs'
import { insertWardrobeItem } from '@/lib/db'
import { checkRateLimit } from '@/lib/rateLimit'

const MAX_FIELD_LENGTH = 200

interface SaveRequest {
  filename: string
  description?: string
  image?: string
  mediaType?: string
  item_type: string
  color: string
  material: string
  formality: string
  fit: string
  silhouette: string
  visual_weight: string
  imageUrl?: string
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
  if (!checkRateLimit(ip, 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body: SaveRequest = await request.json()

    const requiredFields = ['filename', 'item_type', 'color', 'material', 'formality', 'fit', 'silhouette', 'visual_weight']
    for (const field of requiredFields) {
      const val = body[field as keyof SaveRequest]
      if (!val || typeof val !== 'string' || val.trim() === '' || (val.length as any) > MAX_FIELD_LENGTH) {
        return NextResponse.json({ error: `Invalid field: ${field}` }, { status: 400 })
      }
    }

    const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const safeFilename = basename(body.filename).replace(/[^a-zA-Z0-9._-]/g, '_')

    let imageUrl = null

    // Save image if provided
    if (body.image) {
      try {
        const imagesDir = join(process.cwd(), 'public', 'wardrobe-images')
        mkdirSync(imagesDir, { recursive: true })

        // Convert base64 to buffer
        const base64Data = body.image.startsWith('data:') ? body.image.split(',')[1] : body.image
        const buffer = Buffer.from(base64Data, 'base64')

        // Generate filename with id
        const ext = body.mediaType?.includes('png') ? 'png' : body.mediaType?.includes('gif') ? 'gif' : body.mediaType?.includes('webp') ? 'webp' : 'jpg'
        const imageFilename = `${id}.${ext}`
        const imagePath = join(imagesDir, imageFilename)

        writeFileSync(imagePath, buffer)
        imageUrl = `/wardrobe-images/${imageFilename}`
      } catch (err) {
        console.error('Error saving image:', err)
        // Continue without image rather than failing
      }
    }

    const item = await insertWardrobeItem({
      id,
      filename: safeFilename,
      description: body.description?.trim(),
      item_type: body.item_type.trim(),
      color: body.color.trim(),
      material: body.material.trim(),
      formality: body.formality.trim(),
      fit: body.fit.trim(),
      silhouette: body.silhouette.trim(),
      visual_weight: body.visual_weight.trim(),
      uploaded_at: new Date().toISOString(),
      imageUrl: imageUrl || undefined,
    })

    return NextResponse.json(
      { success: true, item, imageUrl, timestamp: new Date().toISOString() },
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
