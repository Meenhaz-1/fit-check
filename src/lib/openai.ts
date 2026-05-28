import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
  throw new Error('OPENAI_API_KEY environment variable is not set')
}

const client = new OpenAI({
  apiKey,
})

export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await client.models.list()
    return !!response
  } catch (error) {
    console.error('OpenAI connection test failed:', error)
    return false
  }
}

// Extract base64 from data URI if needed
function getBase64(imageData: string): string {
  if (imageData.startsWith('data:')) {
    return imageData.split(',')[1]
  }
  return imageData
}

export async function detectClothingItems(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<string[]> {
  try {
    const base64Only = getBase64(imageBase64)
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${base64Only}`,
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

    const content = response.choices[0]?.message?.content
    if (typeof content === 'string') {
      return content.split('\n').filter((line) => line.trim().length > 0)
    }

    return []
  } catch (error) {
    console.error('Clothing detection failed:', error)
    throw error
  }
}

export async function extractMetadata(
  imageBase64: string,
  itemDescription: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<Record<string, string>> {
  try {
    const base64Only = getBase64(imageBase64)
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mediaType};base64,${base64Only}`,
              },
            },
            {
              type: 'text',
              text: `You are analyzing clothing in an image. Extract metadata for ONE item ONLY.

TARGET ITEM TO ANALYZE: "${itemDescription}"

CRITICAL RULES - Follow these EXACTLY:
1. ONLY analyze THIS TARGET ITEM: "${itemDescription}"
2. COMPLETELY IGNORE: glasses, sunglasses, shoes, accessories, other clothing, people, backgrounds - DO NOT analyze these
3. EXTRACT METADATA ONLY FOR: "${itemDescription}"
4. If the target item "${itemDescription}" is NOT clearly visible, return "unknown" for item_type
5. FAILURE CHECK: Your extracted item_type MUST match or describe the target item "${itemDescription}". If you extracted something different (like "glasses" when asked for "blazer"), that is wrong - return "unknown" instead

EXTRACT THESE PROPERTIES (all 7 required):

1. item_type: Exact clothing type. MUST be one of these:
   t-shirt, shirt, button-up shirt, polo shirt, sweater, cardigan, jacket, blazer, coat, dress, jeans, pants, chinos, shorts, skirt, shoes, boots, loafers, or describe specifically

2. color: Primary visible color (e.g., "red", "navy blue", "cream", "burnt orange", "dark green")
   - Be specific, not generic
   - If mixed, list dominant color first

3. material: Fabric type visible (cotton, wool, silk, denim, leather, linen, polyester, velvet, satin, nylon, etc.)
   - Based on visual texture
   - If unsure, describe what you see

4. formality: Social context (casual, business casual, business, formal)
   - Match to typical wearing occasions

5. fit: How the garment fits the body (slim, regular, loose, fitted, oversized, tailored, relaxed)

6. silhouette: Overall outline/shape of the garment when worn
   - straight: Hangs vertically from shoulders/waist without curves, same width throughout
   - tapered: Narrower at bottom than at top (pants taper to ankles)
   - fitted: Closely follows body curves, hugs the body shape
   - oversized: Much larger than body, loose and baggy fit
   - A-line: Fitted at top, flares out wider toward bottom (common in dresses/skirts)
   - flowing: Loose, drapes and moves with fabric, not fitted to body
   - structured: Holds its shape with stiffness/support (armor-like, rigid)

7. visual_weight: Heaviness/thickness (light, medium, heavy)
   - Based on fabric and embellishment

IMPORTANT RULES:
- Always provide all 7 fields
- Use "unknown" ONLY if truly impossible to determine
- Return ONLY valid JSON, no markdown, no text before or after
- Use lowercase for most values

RESPONSE FORMAT:
{"item_type": "...", "color": "...", "material": "...", "formality": "...", "fit": "...", "silhouette": "...", "visual_weight": "..."}`,
            },
          ],
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (typeof content === 'string') {
      try {
        return JSON.parse(content)
      } catch {
        return parseMetadataFromText(content)
      }
    }

    return {}
  } catch (error) {
    console.error('Metadata extraction failed:', error)
    throw error
  }
}

function parseMetadataFromText(text: string): Record<string, string> {
  const metadata: Record<string, string> = {
    item_type: 'clothing item',
    color: 'unknown',
    material: 'unknown',
    formality: 'casual',
    fit: 'regular',
    silhouette: 'straight',
    visual_weight: 'medium',
  }

  const lower = text.toLowerCase()
  const fields: Array<[string, RegExp]> = [
    ['item_type', /item[_\s]?type[:\s"']+([^,\n"']+)/],
    ['color', /color[:\s"']+([^,\n"']+)/],
    ['material', /material[:\s"']+([^,\n"']+)/],
    ['formality', /formality[:\s"']+([^,\n"']+)/],
    ['fit', /fit[:\s"']+([^,\n"']+)/],
    ['silhouette', /silhouette[:\s"']+([^,\n"']+)/],
    ['visual_weight', /visual[_\s]weight[:\s"']+([^,\n"']+)/],
  ]

  for (const [key, pattern] of fields) {
    const match = lower.match(pattern)
    if (match) {
      const val = match[1].trim()
      if (val) metadata[key] = val
    }
  }

  return metadata
}

export async function suggestPairings(
  uploadedItemAnalysis: Record<string, string>,
  wardrobeItems: Array<Record<string, unknown>>
): Promise<Array<{ item: Record<string, unknown>; reason: string; matchScore: number }>> {
  try {
    if (wardrobeItems.length === 0) {
      return getGenericPairingSuggestions(uploadedItemAnalysis)
    }

    const wardrobeItemsList = wardrobeItems
      .map((item) => `- ${item.color} ${item.item_type || 'item'} (${item.formality}, ${item.material})`)
      .join('\n')

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a fashion stylist analyzing wardrobe pairing compatibility.

UPLOADED ITEM ANALYSIS:
- Type: ${uploadedItemAnalysis.detected_type || uploadedItemAnalysis.item_type || 'unknown'}
- Color: ${uploadedItemAnalysis.color}
- Material: ${uploadedItemAnalysis.material}
- Formality: ${uploadedItemAnalysis.formality}
- Fit: ${uploadedItemAnalysis.fit}
- Silhouette: ${uploadedItemAnalysis.silhouette}
- Visual Weight: ${uploadedItemAnalysis.visual_weight}

WARDROBE ITEMS TO MATCH AGAINST:
${wardrobeItemsList}

ANALYSIS CRITERIA:
1. Color harmony (complementary, monochromatic, analogous)
2. Formality level matching
3. Style compatibility (material, silhouette, visual weight)
4. Overall outfit cohesion

Return a JSON array of suggestions in this exact format:
[
  {
    "item_index": 0,
    "reason": "Explanation of why this pairs well",
    "matchScore": 85
  }
]

Only include items with matchScore >= 60. Sort by matchScore descending.
Return ONLY valid JSON, no markdown, no text before or after.`,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (typeof content === 'string') {
      try {
        const suggestions = JSON.parse(content)
        return suggestions.map(
          (s: { item_index: number; reason: string; matchScore: number }) => ({
            item: wardrobeItems[s.item_index],
            reason: s.reason,
            matchScore: s.matchScore,
          })
        )
      } catch {
        return getGenericPairingSuggestions(uploadedItemAnalysis)
      }
    }

    return getGenericPairingSuggestions(uploadedItemAnalysis)
  } catch (error) {
    console.error('Pairing suggestion failed:', error)
    throw error
  }
}

function getGenericPairingSuggestions(
  uploadedItemAnalysis: Record<string, string>
): Array<{ item: Record<string, unknown>; reason: string; matchScore: number }> {
  const color = uploadedItemAnalysis.color || 'this color'
  const formality = uploadedItemAnalysis.formality || 'casual'

  const colorPairs: Record<string, string[]> = {
    red: ['navy', 'white', 'cream', 'black', 'gray'],
    navy: ['white', 'cream', 'khaki', 'red', 'gray'],
    white: ['any color', 'navy', 'black', 'gray', 'earth tones'],
    black: ['white', 'gray', 'navy', 'red', 'gold accents'],
    gray: ['white', 'navy', 'black', 'any color'],
    cream: ['navy', 'brown', 'gray', 'white', 'pastels'],
  }

  const getColorKey = (c: string): string => Object.keys(colorPairs).find((k) => c.toLowerCase().includes(k)) || 'navy'
  const pairedColors = colorPairs[getColorKey(color)] || ['navy', 'white', 'gray']

  return [
    {
      item: { color: pairedColors[0], item_type: 'complement item', formality },
      reason: `${pairedColors[0]} is a complementary color to ${color} and matches ${formality} formality level`,
      matchScore: 75,
    },
    {
      item: { color: pairedColors[1], item_type: 'neutral item', formality },
      reason: `${pairedColors[1]} is a neutral that pairs well with any ${color} item`,
      matchScore: 70,
    },
    {
      item: { color: pairedColors[2], item_type: 'versatile item', formality },
      reason: `${pairedColors[2]} is versatile and works across multiple formality levels`,
      matchScore: 65,
    },
  ]
}

export { client }
