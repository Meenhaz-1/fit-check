import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is not set')
}

const client = new OpenAI({
  apiKey,
})

// Test OpenAI connectivity
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await client.models.list()
    return !!response
  } catch (error) {
    console.error('OpenAI connection test failed:', error)
    return false
  }
}

// Detect clothing items in an image
export async function detectClothingItems(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<string[]> {
  try {
    const response = await client.vision.beta.messages.create({
      model: 'gpt-4-vision',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Identify all clothing items visible in this image. List each item on a separate line. For example: "Blue button-up shirt", "Dark jeans", "White sneakers".',
            },
          ],
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return content.text.split('\n').filter((line) => line.trim().length > 0)
    }

    return []
  } catch (error) {
    console.error('Clothing detection failed:', error)
    throw error
  }
}

// Extract metadata from image description
export async function extractMetadata(
  imageBase64: string,
  itemDescription: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<Record<string, string>> {
  try {
    const response = await client.vision.beta.messages.create({
      model: 'gpt-4-vision',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Extract metadata for this clothing item: "${itemDescription}".

Return JSON with these fields:
- color: (primary color)
- material: (e.g., cotton, wool, denim, leather)
- formality: (casual, business casual, business)
- fit: (slim, regular, loose, fitted)
- silhouette: (straight, tapered, oversized, fitted)
- visual_weight: (light, medium, heavy)

Return ONLY valid JSON, no extra text.`,
            },
          ],
        },
      ],
    })

    const content = response.content[0]
    if (content.type === 'text') {
      try {
        return JSON.parse(content.text)
      } catch {
        return parseMetadataFromText(content.text)
      }
    }

    return {}
  } catch (error) {
    console.error('Metadata extraction failed:', error)
    throw error
  }
}

// Fallback: parse metadata from free-form text
function parseMetadataFromText(text: string): Record<string, string> {
  const metadata: Record<string, string> = {
    color: 'unknown',
    material: 'unknown',
    formality: 'casual',
    fit: 'regular',
    silhouette: 'straight',
    visual_weight: 'medium',
  }

  const lines = text.toLowerCase()
  if (lines.includes('color')) {
    const match = lines.match(/color[:\s]+([a-z\s]+)/i)
    if (match) metadata.color = match[1].trim()
  }
  if (lines.includes('material')) {
    const match = lines.match(/material[:\s]+([a-z\s]+)/i)
    if (match) metadata.material = match[1].trim()
  }

  return metadata
}

export { client }
