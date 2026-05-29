import { extractMetadata } from '@/lib/openai'

export interface ExtractedMetadata {
  item_type: string
  color: string
  material: string
  formality: string
  fit: string
  silhouette: string
  visual_weight: string
}

export async function extractMetadataFromImage(
  base64Image: string,
  mediaType: string = 'image/jpeg'
): Promise<ExtractedMetadata> {
  try {
    if (!base64Image || base64Image.trim() === '') {
      throw new Error('No image data provided')
    }

    const itemDescription = 'clothing item in wardrobe'
    const validMediaType = mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'
    const metadata = await extractMetadata(base64Image, itemDescription, validMediaType)

    console.log('Extracted metadata:', metadata)

    // Validate that all required fields are present
    const requiredFields: (keyof ExtractedMetadata)[] = [
      'item_type',
      'color',
      'material',
      'formality',
      'fit',
      'silhouette',
      'visual_weight',
    ]

    const missingFields = requiredFields.filter(
      (field) => !metadata[field] || metadata[field].trim() === ''
    )

    if (missingFields.length > 0) {
      console.warn(`Some fields are empty: ${missingFields.join(', ')}`)
    }

    return metadata as unknown as ExtractedMetadata
  } catch (error) {
    console.error('Error extracting metadata:', error)
    throw new Error(
      error instanceof Error ? error.message : 'Failed to extract metadata from image'
    )
  }
}
