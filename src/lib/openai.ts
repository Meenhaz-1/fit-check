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
    console.log(`[suggestPairings] Received ${wardrobeItems.length} wardrobe items`)

    if (wardrobeItems.length === 0) {
      console.log('[suggestPairings] No wardrobe items, using generic suggestions')
      return await getGenericPairingSuggestions(uploadedItemAnalysis)
    }

    const wardrobeItemsList = wardrobeItems
      .map((item, idx) => `${idx}: ${item.color} ${item.item_type || 'item'} (${item.formality}, ${item.material})`)
      .join('\n')

    console.log('[suggestPairings] Wardrobe items list:\n', wardrobeItemsList)

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

WARDROBE ITEMS TO MATCH AGAINST (indexed 0-${wardrobeItems.length - 1}):
${wardrobeItemsList}

CRITICAL CONSTRAINTS:
1. EXCLUDE items that are the same type as the uploaded item (e.g., don't suggest another shirt for a shirt)
2. EXCLUDE complete outfit replacements (only dresses replace tops):
   - If uploaded item is a TOP (shirt, t-shirt, blouse, sweater, etc): DO NOT suggest dresses (but skirts, pants, jackets are welcome)
   - If uploaded item is a DRESS: DO NOT suggest other tops/shirts/blouses (dress already serves as the top)
3. Suggest COMPLEMENTARY item types that would be worn TOGETHER with the uploaded item
- Examples: with shirt→skirts/pants/jacket/shoes; with pants→shirt/jacket; with dress→shoes/jacket/accessories

ANALYSIS CRITERIA:
1. Color harmony (complementary, monochromatic, analogous)
2. Formality level matching
3. Style compatibility (material, silhouette, visual weight)
4. Overall outfit cohesion
5. Item type complementarity (different categories that work together)

Return a JSON array of suggestions in this exact format. YOU MUST return ALL matching items with different types:
[
  {
    "item_index": 0,
    "reason": "Explanation of why this pairs well",
    "matchScore": 85
  },
  {
    "item_index": 1,
    "reason": "Explanation of why this pairs well",
    "matchScore": 75
  }
]

Include ALL items with matchScore >= 50. Sort by matchScore descending.
IMPORTANT: Do NOT include items of the same type as the uploaded item.
Return ONLY valid JSON, no markdown, no text before or after.`,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    console.log('[suggestPairings] Raw GPT response:', content?.substring(0, 200))

    if (typeof content === 'string') {
      try {
        // Strip markdown code blocks if present
        let jsonContent = content.trim()
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }

        const suggestions = JSON.parse(jsonContent)
        console.log('[suggestPairings] Parsed suggestions:', suggestions.length, 'items')

        const result = suggestions.map(
          (s: { item_index: number; reason: string; matchScore: number }) => ({
            item: wardrobeItems[s.item_index],
            reason: s.reason,
            matchScore: s.matchScore,
          })
        )
        console.log('[suggestPairings] Returning', result.length, 'wardrobe-based suggestions')
        return result
      } catch (parseError) {
        console.error('[suggestPairings] JSON parse error:', parseError, 'Content:', content?.substring(0, 300))
        return await getGenericPairingSuggestions(uploadedItemAnalysis)
      }
    }

    console.log('[suggestPairings] No content from GPT response')
    return await getGenericPairingSuggestions(uploadedItemAnalysis)
  } catch (error) {
    console.error('[suggestPairings] Error:', error)
    throw error
  }
}

async function getGenericPairingSuggestions(
  uploadedItemAnalysis: Record<string, string>
): Promise<Array<{ item: Record<string, unknown>; reason: string; matchScore: number }>> {
  try {
    console.log('[getGenericPairingSuggestions] Generating smart suggestions via GPT-4o')

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `You are a fashion stylist. A user has uploaded an item but has an empty wardrobe. Suggest 3 generic clothing items that would pair well with their uploaded item.

UPLOADED ITEM:
- Type: ${uploadedItemAnalysis.detected_type || uploadedItemAnalysis.item_type || 'clothing item'}
- Color: ${uploadedItemAnalysis.color}
- Material: ${uploadedItemAnalysis.material}
- Formality: ${uploadedItemAnalysis.formality}
- Fit: ${uploadedItemAnalysis.fit}
- Silhouette: ${uploadedItemAnalysis.silhouette}
- Visual Weight: ${uploadedItemAnalysis.visual_weight}

Suggest 3 generic clothing items (complementary types, NOT the same type or complete outfit replacements) that would pair well.

CRITICAL CONSTRAINTS:
- Do NOT suggest another ${uploadedItemAnalysis.item_type || 'item of the same type'}
- If item is a TOP (shirt, t-shirt, blouse, sweater): Do NOT suggest dresses (but skirts, pants, jackets are welcome)
- If item is a DRESS: Do NOT suggest other tops or blouses (dress already serves as the top)
- For shoes: suggest women's-appropriate footwear like flats, heels, pumps, ankle boots, pointed-toe shoes (avoid loafers for women's fashion)
- Suggest only items that would be worn TOGETHER in the same outfit
Examples: with blouse→pants/skirt/jacket/heels; with pants→blouse/jacket; with dress→heels/jacket/accessories

Consider color harmony, formality matching, style compatibility, and appropriateness for women's fashion.

Return ONLY valid JSON, no markdown, in this format (include fit for pants/jeans):
[
  {
    "item_type": "dark blue slim jeans",
    "reason": "Complements the color and creates casual contrast",
    "matchScore": 80
  },
  {
    "item_type": "white fitted shirt",
    "reason": "Provides neutral pairing for a balanced look",
    "matchScore": 75
  },
  {
    "item_type": "black pointed-toe heels",
    "reason": "Grounds the outfit and adds visual interest",
    "matchScore": 70
  }
]`,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (typeof content === 'string') {
      try {
        // Strip markdown code blocks if present
        let jsonContent = content.trim()
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }

        const suggestions = JSON.parse(jsonContent)
        console.log('[getGenericPairingSuggestions] Generated', suggestions.length, 'generic suggestions')

        return suggestions.map(
          (s: { item_type: string; reason: string; matchScore: number }) => ({
            item: { item_type: s.item_type, formality: uploadedItemAnalysis.formality || 'casual' },
            reason: s.reason,
            matchScore: s.matchScore,
          })
        )
      } catch (parseError) {
        console.error('[getGenericPairingSuggestions] Parse error:', parseError)
        return getHardcodedFallback(uploadedItemAnalysis)
      }
    }

    return getHardcodedFallback(uploadedItemAnalysis)
  } catch (error) {
    console.error('[getGenericPairingSuggestions] Error:', error)
    return getHardcodedFallback(uploadedItemAnalysis)
  }
}

function getHardcodedFallback(
  uploadedItemAnalysis: Record<string, string>
): Array<{ item: Record<string, unknown>; reason: string; matchScore: number }> {
  const formality = uploadedItemAnalysis.formality || 'casual'
  return [
    {
      item: { item_type: 'neutral pants or skirt', formality },
      reason: 'Provides a neutral base to let your uploaded item stand out',
      matchScore: 70,
    },
    {
      item: { item_type: 'complementary shoes', formality },
      reason: 'Completes the outfit and grounds the overall look',
      matchScore: 65,
    },
    {
      item: { item_type: 'layering piece', formality },
      reason: 'Adds depth and allows for styling flexibility',
      matchScore: 60,
    },
  ]
}

export { client }
