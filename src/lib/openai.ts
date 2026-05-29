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

ANALYSIS CRITERIA (must reference in reasoning):
1. Color harmony - how the suggested item's color works with the red and white plaid pattern
2. Formality level matching - ensure casual item pairs with casual shirt
3. Style compatibility - how material, silhouette, visual weight align with the cotton, straight, light weight shirt
4. Fit harmony - how the suggested item's fit complements the regular fit shirt
5. Overall outfit cohesion - create a visually balanced complete look

REASONING REQUIREMENTS:
- MUST mention specific properties from the uploaded item (plaid pattern, cotton, straight silhouette, light weight, casual, regular fit)
- MUST explain HOW the suggested item complements these specific properties
- Example: "The dark blue slim jeans complement the red and white plaid pattern while the cotton denim matches the shirt's casual cotton aesthetic"

Return a JSON array of suggestions in this exact format. YOU MUST return ALL matching items with different types:
[
  {
    "item_index": 0,
    "reason": "Specific explanation referencing the shirt's properties (plaid, cotton, straight, light, casual, regular fit)",
    "matchScore": 85
  },
  {
    "item_index": 1,
    "reason": "Specific explanation referencing the shirt's properties",
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

REASONING REQUIREMENTS:
- MUST mention specific properties from the uploaded item (color, material, silhouette, visual weight, fit, formality)
- MUST explain HOW the suggested item complements these properties
- Example for red shirt: "The dark blue jeans complement the red color while the regular fit matches the shirt's straight silhouette for visual cohesion"

Return ONLY valid JSON, no markdown, in this format (include fit for pants/jeans):
[
  {
    "item_type": "dark blue slim jeans",
    "reason": "The dark blue creates color harmony with the red while the slim fit complements the shirt's straight silhouette and casual cotton aesthetic",
    "matchScore": 80
  },
  {
    "item_type": "light brown blazer",
    "reason": "Adds layering to balance the light visual weight while maintaining the casual formality of the cotton shirt",
    "matchScore": 75
  },
  {
    "item_type": "white canvas sneakers",
    "reason": "Echoes the white tones in the pattern while the casual sneaker style matches the shirt's relaxed straight fit",
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

export async function evaluateOutfit(
  detectedItems: Array<{ type: string; color: string; material: string; formality: string; fit: string; silhouette: string; visual_weight: string }>
): Promise<{
  whatWorksWell: string[]
  whatCouldImprove: string[]
  specificStylingRecommendations: string[]
  occasions: string[]
  verdict?: 'Buy' | 'Maybe' | 'Do Not Buy'
  verdictReasoning?: string
  colorHarmony: number
  proportionBalance: number
  formalityAlignment: number
  overallCohesion: number
}> {
  try {
    console.log('[evaluateOutfit] Analyzing', detectedItems.length, 'items')

    const itemsList = detectedItems
      .map((item, idx) => `${idx + 1}. ${item.color} ${item.type} (${item.material}, ${item.formality}, ${item.fit}, ${item.silhouette}, ${item.visual_weight})`)
      .join('\n')

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are a professional fashion stylist evaluating a complete outfit.

DETECTED ITEMS IN OUTFIT:
${itemsList}

COMPREHENSIVE EVALUATION REQUIREMENTS:

1. COLOR HARMONY - How do the colors work together? Any clashing or complementary?
2. PROPORTIONS - Are sleeve lengths, hem lengths, and fit proportions balanced?
3. VISUAL WEIGHT DISTRIBUTION - Is the outfit balanced or is one piece too heavy/light?
4. FORMALITY ALIGNMENT - Do all pieces match the same formality level?
5. STYLE COHESION - Do all pieces feel intentional together?
6. OCCASIONS - What specific settings or events suit this outfit?

RESPONSE REQUIREMENTS:
- MUST provide specific, actionable feedback
- Reference specific properties from the items (colors, materials, fit)
- Provide 3-4 points for "What works well" and 2-3 for "What could improve"
- Include 3-4 specific styling tips (e.g., "tuck the shirt", "roll sleeves", "add a belt")
- Rate each analysis dimension (0-100): color harmony, proportion balance, formality alignment, overall cohesion
- Optional: Include verdict ("Buy"/"Maybe"/"Do Not Buy") only if you have strong opinion based on occasion
- List 3-4 occasions this outfit is perfect for

Return ONLY valid JSON with this exact structure:
{
  "whatWorksWell": [
    "Specific observation 1 referencing the items",
    "Specific observation 2",
    "Specific observation 3"
  ],
  "whatCouldImprove": [
    "Specific critique 1 with suggested solution",
    "Specific critique 2 with suggested solution"
  ],
  "specificStylingRecommendations": [
    "Actionable tip 1 (e.g., tuck the shirt or roll sleeves)",
    "Actionable tip 2",
    "Actionable tip 3"
  ],
  "occasions": ["setting 1", "setting 2", "setting 3"],
  "verdict": "Buy or Maybe or Do Not Buy (optional - only if evaluating for purchase)",
  "verdictReasoning": "Brief reason if verdict provided (optional)",
  "colorHarmony": 85,
  "proportionBalance": 78,
  "formalityAlignment": 88,
  "overallCohesion": 82
}

NO markdown, no explanations, ONLY JSON.`,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    console.log('[evaluateOutfit] Raw GPT response length:', content?.length)

    if (typeof content === 'string') {
      try {
        // Strip markdown code blocks if present
        let jsonContent = content.trim()
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }

        const evaluation = JSON.parse(jsonContent)
        console.log('[evaluateOutfit] Successfully parsed evaluation')
        return evaluation
      } catch (parseError) {
        console.error('[evaluateOutfit] JSON parse error:', parseError, 'Content:', content?.substring(0, 300))
        return getEvaluationFallback()
      }
    }

    console.log('[evaluateOutfit] No content from GPT response')
    return getEvaluationFallback()
  } catch (error) {
    console.error('[evaluateOutfit] Error:', error)
    throw error
  }
}

function getEvaluationFallback() {
  return {
    whatWorksWell: [
      'The outfit pieces are coordinated in color and formality',
      'All items appear to be chosen intentionally',
    ],
    whatCouldImprove: [
      'Consider specific fit adjustments for optimal proportions',
      'Ensure all pieces align with the intended occasion',
    ],
    specificStylingRecommendations: [
      'Adjust fit where needed for visual balance',
      'Verify all pieces match your desired formality level',
      'Consider adding complementary accessories',
    ],
    occasions: ['casual', 'professional', 'everyday'],
    colorHarmony: 70,
    proportionBalance: 70,
    formalityAlignment: 75,
    overallCohesion: 70,
  }
}

export async function analyzePairingDetailed(
  uploadedItem: Record<string, string>,
  suggestedItem: Record<string, unknown>
): Promise<{
  whatWorksWell: string[]
  whatCouldImprove: string[]
  stylingTips: string[]
  matchScore: number
}> {
  try {
    const uploadedItemStr = `${uploadedItem.color || 'unknown'} ${uploadedItem.type || 'item'} (${uploadedItem.material || 'unknown'} material, ${uploadedItem.fit || 'regular'} fit, ${uploadedItem.formality || 'casual'} formality)`
    const suggestedItemStr = `${(suggestedItem as any).color || 'unknown'} ${(suggestedItem as any).filename || (suggestedItem as any).item_type || 'item'} (${(suggestedItem as any).material || 'unknown'} material, ${(suggestedItem as any).fit || 'regular'} fit)`

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a professional fashion stylist analyzing how well two clothing items pair together.

UPLOADED ITEM: ${uploadedItemStr}
SUGGESTED WARDROBE ITEM: ${suggestedItemStr}

ANALYSIS REQUIREMENTS:
1. Color compatibility - How do the colors work together?
2. Visual proportions - Do the silhouettes and fits balance each other?
3. Formality level - Do both items match in formality?
4. Style cohesion - Do the materials and styles feel intentional together?

RESPONSE REQUIREMENTS:
- Provide 3-4 specific points for "What works well" that reference the actual item properties
- Provide 2-3 constructive critiques for "What could improve" with suggested solutions
- Include 3-4 specific styling tips (e.g., "tuck the shirt", "roll sleeves", "add a belt")
- Provide a match score (0-100) based on overall compatibility

Return ONLY valid JSON with this exact structure:
{
  "whatWorksWell": [
    "Specific observation 1 referencing the actual items and their properties",
    "Specific observation 2",
    "Specific observation 3"
  ],
  "whatCouldImprove": [
    "Specific critique 1 with suggested solution",
    "Specific critique 2 with suggested solution"
  ],
  "stylingTips": [
    "Actionable tip 1 (e.g., tuck, roll sleeves, add accessory)",
    "Actionable tip 2",
    "Actionable tip 3"
  ],
  "matchScore": 85
}

NO markdown, no explanations, ONLY JSON.`,
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

        const analysis = JSON.parse(jsonContent)
        return analysis
      } catch (parseError) {
        console.error('[analyzePairingDetailed] JSON parse error:', parseError)
        return getPairingFallback()
      }
    }

    return getPairingFallback()
  } catch (error) {
    console.error('[analyzePairingDetailed] Error:', error)
    throw error
  }
}

function getPairingFallback() {
  return {
    whatWorksWell: [
      'The items share a similar formality level',
      'Colors are complementary and work together',
    ],
    whatCouldImprove: [
      'Consider testing the fit proportions together',
    ],
    stylingTips: [
      'Pair these items together for a cohesive look',
      'Ensure the fit proportions balance well',
    ],
    matchScore: 75,
  }
}

export { client }
