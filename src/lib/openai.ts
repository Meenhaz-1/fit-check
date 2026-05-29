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

export async function extractMetadataForMultipleItems(
  imageBase64: string,
  selectedItems: string[],
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<Array<Record<string, string>>> {
  try {
    const base64Only = getBase64(imageBase64)
    const itemsList = selectedItems.map((item, idx) => `${idx + 1}. ${item}`).join('\n')

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1024,
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
              text: `You are analyzing clothing in an image. Extract metadata for MULTIPLE items in ONE pass.

ITEMS TO ANALYZE (in order):
${itemsList}

EXTRACT METADATA FOR ALL ${selectedItems.length} ITEMS AT ONCE. For each item, extract:
1. color: Primary visible color (specific, e.g., "sage green", "navy blue", not generic)
2. material: Fabric type (cotton, wool, silk, denim, linen, leather, etc.)
3. formality: Casual, business casual, business, or formal
4. fit: slim, regular, loose, fitted, oversized, tailored, or relaxed
5. silhouette: straight, tapered, fitted, oversized, A-line, flowing, or structured
6. visual_weight: light, medium, or heavy

Return a JSON array with metadata for each item in the SAME ORDER as listed above:
[
  {"color": "...", "material": "...", "formality": "...", "fit": "...", "silhouette": "...", "visual_weight": "..."},
  {"color": "...", "material": "...", "formality": "...", "fit": "...", "silhouette": "...", "visual_weight": "..."}
]

RULES:
- RETURN EXACTLY ${selectedItems.length} objects in the array
- Each object must have all 6 fields
- Use lowercase values
- Return ONLY valid JSON, no markdown`,
            },
          ],
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

        const metadataArray = JSON.parse(jsonContent)
        console.log(`[extractMetadataForMultipleItems] Extracted metadata for ${metadataArray.length} items`)
        return Array.isArray(metadataArray) ? metadataArray : [metadataArray]
      } catch (parseError) {
        console.error('[extractMetadataForMultipleItems] Parse error:', parseError)
        // Fallback: return default metadata for each item
        return selectedItems.map(() => ({
          color: 'unknown',
          material: 'unknown',
          formality: 'casual',
          fit: 'regular',
          silhouette: 'straight',
          visual_weight: 'medium',
        }))
      }
    }

    return selectedItems.map(() => ({
      color: 'unknown',
      material: 'unknown',
      formality: 'casual',
      fit: 'regular',
      silhouette: 'straight',
      visual_weight: 'medium',
    }))
  } catch (error) {
    console.error('[extractMetadataForMultipleItems] Error:', error)
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
  detectedItems: Array<{ type: string; color: string; material: string; formality: string; fit: string; silhouette: string; visual_weight: string }>,
  persona: string = 'minimalist'
): Promise<{
  whatWorksWell: string[]
  whatCouldImprove: string[]
  specificStylingRecommendations: string[]
  occasions: string[]
  completeLook?: {
    tops?: string[]
    bottoms?: string[]
    footwear: string[]
    accessories: string[]
  }
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

    const isSingleItem = detectedItems.length === 1
    const analysisMode = isSingleItem ? 'SINGLE_ITEM_QUALITY' : 'OUTFIT_COHESION'

    const personaConfig = persona === 'trendforward' ? {
      name: 'TREND-FORWARD STYLIST',
      philosophy: 'Values self-expression and fashion evolution. Excited about color, pattern, and personal style. Evaluates against contemporary aesthetics and trends.',
      verdictFramework: 'Will this reflect and elevate the wearer\'s personal style? Is it current and fashion-forward? Will the wearer love wearing it?',
      stylePreferences: 'Bold color combinations, trend-aware pieces, creative mixing, personality-driven styling.',
      critique: 'Look for: lack of personal expression, overly safe/neutral choices, outdated silhouettes or trends that don\'t serve the wearer\'s style evolution.',
    } : {
      name: 'HERITAGE MINIMALIST ADVISOR',
      philosophy: 'Values restraint, quality, and timeless design. Evaluates against enduring standards. Emphasizes pieces that work for years, not seasons.',
      verdictFramework: 'Will this still be relevant in 5+ years? Is it a quality investment? Does it serve the wardrobe foundation?',
      stylePreferences: 'Neutral palettes, classic silhouettes, quality materials, layering for longevity, investment-piece mentality.',
      critique: 'Look for: bold colors that limit combinations, trendy cuts that date quickly, insufficient quality for the price, pieces that don\'t have longevity.',
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `You are a professional luxury fashion stylist providing expert analysis.

ANALYSIS PERSPECTIVE: ${personaConfig.name}
PHILOSOPHY: ${personaConfig.philosophy}
STYLING PREFERENCES: ${personaConfig.stylePreferences}

DETECTED ITEMS:
${itemsList}

ANALYSIS MODE: ${analysisMode}
${isSingleItem ? '(Single item evaluation: assess QUALITY, not outfit completeness)' : '(Complete outfit evaluation: assess cohesion and styling)'}

REFERENCE: Use color theory (complementary, analogous, monochromatic), visual weight (dark/heavy vs light), fit balance (fitted+loose), and formality alignment in your analysis. Heritage Minimalist values: quality, timelessness, versatility. Trend-Forward values: self-expression, bold choices, contemporary relevance.

${isSingleItem ? `
═══ SINGLE ITEM EVALUATION ═══

Assess the ITEM'S QUALITY for purchase worthiness. Reference: fabric, construction, color, fit, versatility, timelessness (for Minimalist) or trendiness (for Trend-Forward).

WHAT WORKS WELL: 3-4 specific quality observations with reasoning
WHAT COULD IMPROVE: 2-3 actual item flaws (PROBLEM → CONSEQUENCE → SOLUTION)
STYLING RECOMMENDATIONS: 3-4 specific ways to style this item
OCCASIONS: How to pair/wear this item
COMPLETE THE LOOK: Suggest complementary pieces (bottoms for tops, tops for bottoms, footwear, accessories)
VERDICT REASONING: Should you buy this? Why or why not?

CRITICAL SCORING - MUST VARY BY PERSONA (0-100):

YOU MUST SCORE DIFFERENTLY FOR EACH PERSONA. DO NOT RETURN THE SAME SCORES.

${persona === 'trendforward' ? `TREND-FORWARD (REWARD BOLDNESS): Score color/proportions/design HIGH (80+) if bold, trendy, expressive. Score LOW (45-65) if safe, neutral, generic.
Examples:
- Sage green shorts: colorHarmony=88 (bold & trendy), proportionBalance=86 (flattering & intentional), formalityAlignment=84 (expressive design), overallCohesion=87
- Navy shorts: colorHarmony=52 (predictable), proportionBalance=62 (generic), formalityAlignment=58 (conventional), overallCohesion=55
- Black shorts: colorHarmony=45 (safe), proportionBalance=60 (ordinary), formalityAlignment=50 (uninspired), overallCohesion=48` : `HERITAGE MINIMALIST (REWARD VERSATILITY): Score color/proportions/design HIGH (85+) if neutral, timeless, versatile. Score LOW (50-70) if trendy, bold, will date.
Examples:
- Navy shorts: colorHarmony=91 (versatile, timeless), proportionBalance=87 (classic cut), formalityAlignment=88 (works everywhere), overallCohesion=89
- Sage green shorts: colorHarmony=67 (trendy, limits pairings), proportionBalance=72 (will date), formalityAlignment=68 (specific use), overallCohesion=65
- Black shorts: colorHarmony=89 (works with everything), proportionBalance=85 (timeless), formalityAlignment=86 (versatile), overallCohesion=87`}
` : `
═══ COMPLETE OUTFIT EVALUATION ═══

Assess color harmony, visual weight distribution, fit balance, formality alignment, and style cohesion. Reference color theory, silhouette pairing, and persona-specific criteria.

WHAT WORKS WELL: 3-4 specific design observations with reasoning
WHAT COULD IMPROVE: 2-4 specific issues (PROBLEM → CONSEQUENCE → SOLUTION)
STYLING RECOMMENDATIONS: 3-4 specific actionable tips
OCCASIONS: 3-4 specific settings
COMPLETE THE LOOK: Missing pieces only (footwear, accessories)
VERDICT REASONING: Does this outfit work? Why or why not?

CRITICAL SCORING - MUST VARY BY PERSONA (0-100):

YOU MUST SCORE DIFFERENTLY FOR EACH PERSONA. DO NOT RETURN THE SAME SCORES.

${persona === 'trendforward' ? `TREND-FORWARD (REWARD BOLD COMBINATIONS): Score HIGH (82+) for bold, contemporary color pairings and expressive styling. Score LOW (50-70) for safe, conventional outfits.
Examples:
- Sage + cream + gold accents: colorHarmony=87, proportionBalance=85, formalityAlignment=83, overallCohesion=86
- Navy + white + beige: colorHarmony=52, proportionBalance=65, formalityAlignment=58, overallCohesion=55` : `HERITAGE MINIMALIST (REWARD TIMELESS COHESION): Score HIGH (85+) for classic, neutral combinations that will work forever. Score LOW (50-70) for trendy, bold color mixing.
Examples:
- Navy + cream + camel: colorHarmony=90, proportionBalance=87, formalityAlignment=88, overallCohesion=89
- Sage + cream + gold: colorHarmony=63, proportionBalance=71, formalityAlignment=65, overallCohesion=62`}
`}

Return ONLY valid JSON with this exact structure:
{
  "whatWorksWell": [
    "${isSingleItem ? 'Quality observation 1 WITH reasoning' : 'Design principle observation 1 WITH COLOR/DESIGN REASONING'}",
    "Observation 2 WITH detailed explanation",
    "Observation 3"
  ],
  "whatCouldImprove": [
    "${isSingleItem ? 'ACTUAL ITEM FLAW → CONSEQUENCE → SOLUTION' : 'PROBLEM → CONSEQUENCE → SOLUTION'} for issue 1",
    "PROBLEM → CONSEQUENCE → SOLUTION for issue 2"
  ],
  "specificStylingRecommendations": [
    "${isSingleItem ? 'How to style this piece (tuck, pair with X, etc.)' : 'SPECIFIC technique with alternatives'}",
    "SPECIFIC styling detail or pairing",
    "SPECIFIC accessory/styling suggestion"
  ],
  "occasions": [${isSingleItem ? '"Pairing suggestion 1 (style description)", "Pairing suggestion 2"' : '"Specific setting 1", "Specific setting 2"'}],
  "completeLook": {
    ${(() => {
      if (isSingleItem) {
        const itemType = detectedItems[0].type.toLowerCase()
        const isTop = ['shirt', 't-shirt', 'blouse', 'sweater', 'cardigan', 'jacket', 'blazer', 'coat'].some(t => itemType.includes(t))
        const isBottom = ['pants', 'jeans', 'chinos', 'shorts', 'skirt'].some(t => itemType.includes(t))

        if (isTop) {
          return `"bottoms": ["Option 1 (reasoning)", "Option 2 (reasoning)"],
    "footwear": ["Option 1 (reasoning)", "Option 2 (reasoning)"],
    "accessories": ["Option 1 (reasoning)", "Option 2 (reasoning)", "Option 3 (reasoning)"]`
        } else if (isBottom) {
          return `"tops": ["Option 1 (reasoning)", "Option 2 (reasoning)"],
    "footwear": ["Option 1 (reasoning)", "Option 2 (reasoning)"],
    "accessories": ["Option 1 (reasoning)", "Option 2 (reasoning)", "Option 3 (reasoning)"]`
        } else {
          return `"footwear": ["Option 1", "Option 2"],
    "accessories": ["Option 1 (reasoning)", "Option 2 (reasoning)", "Option 3 (reasoning)"]`
        }
      } else {
        return `"footwear": ["Option 1 (reasoning)", "Option 2 (reasoning)"],
    "accessories": ["Option 1 (reasoning)", "Option 2 (reasoning)", "Option 3 (reasoning)"]`
      }
    })()}
  },
  "verdict": "Buy or Maybe or Do Not Buy",
  "verdictReasoning": "${isSingleItem ? 'Is this worth buying? What specific factors influence this?' : 'Does this outfit work? What would improve it?'}",
  "colorHarmony": ${isSingleItem ? 'Score how versatile the color is (0-100)' : '85'},
  "proportionBalance": ${isSingleItem ? 'Score how well proportions fit the body (0-100)' : '78'},
  "formalityAlignment": ${isSingleItem ? 'Score how well it matches intended formality (0-100)' : '88'},
  "overallCohesion": ${isSingleItem ? 'Score overall design quality (0-100)' : '82'}
}

NO markdown, no explanations, ONLY valid JSON.`,
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
        return getEvaluationFallback(isSingleItem, persona)
      }
    }

    console.log('[evaluateOutfit] No content from GPT response')
    return getEvaluationFallback(isSingleItem, persona)
  } catch (error) {
    console.error('[evaluateOutfit] Error:', error)
    throw error
  }
}

function getEvaluationFallback(isSingleItem: boolean = false, persona: string = 'minimalist') {
  if (isSingleItem) {
    return {
      whatWorksWell: [
        'The color has good saturation and appears versatile for pairing with multiple wardrobe items',
        'The material quality appears solid with appropriate weight for its intended use',
        'The fit and proportions are well-executed for the garment type',
      ],
      whatCouldImprove: [
        'PROBLEM: Limited styling versatility. CONSEQUENCE: May be harder to incorporate into various outfit combinations. SOLUTION: Look for pieces in neutral tones or complementary colors that pair with more wardrobe pieces.',
        'PROBLEM: Formality level may be narrow. CONSEQUENCE: Limited occasion versatility. SOLUTION: Consider pieces that bridge casual and smart-casual for broader use.',
      ],
      specificStylingRecommendations: [
        'Pair with neutral bottoms (white, cream, navy, black, gray) to let the piece shine',
        'Layer with complementary outerwear that matches the formality level',
        'Accessorize with pieces that echo existing colors or materials in the garment',
      ],
      occasions: [
        'Paired with structured bottoms for smart-casual settings',
        'Layered with neutral outerwear for elevated casual',
        'Combined with complementary accessories for defined styling',
      ],
      completeLook: {
        footwear: ['Neutral leather shoes that ground the look', 'Simple sneakers for contemporary casual'],
        accessories: ['Minimal jewelry that doesn\'t compete with the piece', 'Belt or watch in a complementary tone', 'Structured bag that matches the formality level'],
      },
      verdict: 'Maybe',
      verdictReasoning: 'The item shows solid design fundamentals. Purchase if the color and style fit your existing wardrobe and lifestyle. Consider passing if you need higher versatility or different formality level.',
      colorHarmony: 72,
      proportionBalance: 75,
      formalityAlignment: 70,
      overallCohesion: 71,
    }
  }

  return {
    whatWorksWell: [
      'The pieces demonstrate intentional color pairing with clear visual hierarchy',
      'Formality levels are well-matched across all items, creating a cohesive message',
      'Visual weight is distributed to create balance rather than dominance of a single element',
    ],
    whatCouldImprove: [
      'PROBLEM: Lack of precise styling direction. CONSEQUENCE: The outfit reads as adequate rather than curated. SOLUTION: Apply specific styling techniques (tuck, roll, cinch) to create intentional silhouette.',
      'PROBLEM: Missing contextual clarity. CONSEQUENCE: Unclear what occasion this serves. SOLUTION: Choose bottoms, footwear, and accessories that anchor the outfit to a specific setting.',
    ],
    specificStylingRecommendations: [
      'Adjust the fit through tailoring or styling technique (e.g., tuck or cinch) to define the silhouette and create visual balance',
      'Select complementary bottoms and footwear that echo the primary outfit\'s color story and formality level',
      'Add one intentional accessory (belt, watch, or jewelry) that references an existing color or material in the outfit',
    ],
    occasions: [
      'Casual professional setting with relaxed dress code',
      'Daytime social gathering with intentional styling',
      'Context-adaptive scenario where moderate formality is appropriate',
    ],
    completeLook: {
      bottoms: ['Neutral chinos or trousers that echo the outfit\'s formality', 'Structured skirt or pants for added sophistication'],
      footwear: ['Neutral leather shoes that ground the color palette', 'Minimal sneakers for contemporary casual edge'],
      accessories: ['Leather belt in a complementary tone (anchors proportions)', 'Watch or simple bracelet (adds intentional detail)', 'Structured bag that matches the outfit\'s formality level'],
    },
    verdict: 'Maybe',
    verdictReasoning: 'The foundation is sound with good color and formality alignment, but requires specific styling execution and contextual anchoring through accessories and bottoms to elevate from adequate to deliberate.',
    colorHarmony: 72,
    proportionBalance: 68,
    formalityAlignment: 76,
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

// Helper function to categorize item by type
function categorizeItem(itemType: string): 'top' | 'bottom' | 'shoes' | 'accessory' | 'unknown' {
  const lower = (itemType || '').toLowerCase()

  // Tops
  if (lower.includes('shirt') || lower.includes('blouse') || lower.includes('t-shirt') ||
      lower.includes('sweater') || lower.includes('sweatshirt') || lower.includes('cardigan') ||
      lower.includes('polo') || lower.includes('vest') || lower.includes('top')) {
    return 'top'
  }

  // Bottoms
  if (lower.includes('pant') || lower.includes('jean') || lower.includes('trouser') ||
      lower.includes('skirt') || lower.includes('short') || lower.includes('legging') ||
      lower.includes('cargo')) {
    return 'bottom'
  }

  // Shoes
  if (lower.includes('shoe') || lower.includes('boot') || lower.includes('sneaker') ||
      lower.includes('loafer') || lower.includes('sandal') || lower.includes('heel') ||
      lower.includes('flat') || lower.includes('pump') || lower.includes('oxford')) {
    return 'shoes'
  }

  // Accessories
  if (lower.includes('jacket') || lower.includes('blazer') || lower.includes('coat') ||
      lower.includes('hat') || lower.includes('cap') || lower.includes('sunglasses') ||
      lower.includes('glasses') || lower.includes('bag') || lower.includes('scarf')) {
    return 'accessory'
  }

  return 'unknown'
}

// Generate complete outfit suggestions (top + bottom + shoes + optional accessories)
export async function generateOutfitSuggestions(
  selectedPieceMetadata: Record<string, string>,
  wardrobeItems: any[],
  pieceType: 'top' | 'bottom' | 'shoes',
  selectedItemId?: string
) {
  try {
    // Categorize wardrobe items
    const tops = wardrobeItems.filter(item => categorizeItem(item.item_type) === 'top')
    const bottoms = wardrobeItems.filter(item => categorizeItem(item.item_type) === 'bottom')
    const shoes = wardrobeItems.filter(item => categorizeItem(item.item_type) === 'shoes')
    const accessories = wardrobeItems.filter(item => categorizeItem(item.item_type) === 'accessory')

    // Format each category
    const formatItemList = (items: any[]) => {
      return items
        .map(item => {
          const color = item.color || 'unknown'
          const material = item.material || 'unknown'
          const formality = item.formality || 'casual'
          const weight = item.visual_weight || 'medium'
          const fit = item.fit || 'unknown'
          const silhouette = item.silhouette || 'unknown'
          return `ID:${item.id} | ${item.item_type} | Color:${color} | Material:${material} | Formality:${formality} | Weight:${weight} | Fit:${fit} | Silhouette:${silhouette}`
        })
        .join('\n')
    }

    const topsList = formatItemList(tops)
    const bottomsList = formatItemList(bottoms)
    const shoesList = formatItemList(shoes)
    const accessoriesList = formatItemList(accessories)

    const selectedType = selectedPieceMetadata.item_type || 'clothing item'
    const selectedColor = selectedPieceMetadata.color || 'unknown'
    const selectedMaterial = selectedPieceMetadata.material || 'unknown'
    const selectedFormality = selectedPieceMetadata.formality || 'casual'

    const selectedItemConstraint = selectedItemId
      ? `SELECTED PIECE TO FEATURE (MUST appear in ALL 3 outfits):
ID: ${selectedItemId}
Category: ${pieceType.toUpperCase()}
- Type: ${selectedType}
- Color: ${selectedColor}
- Material: ${selectedMaterial}
- Formality: ${selectedFormality}

This item MUST be included in every outfit (as ${pieceType}Id in all 3 combinations).`
      : `SELECTED PIECE (${pieceType}):
- Type: ${selectedType}
- Color: ${selectedColor}
- Material: ${selectedMaterial}
- Formality: ${selectedFormality}`

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a professional stylist generating complete outfit combinations.

${selectedItemConstraint}

AVAILABLE WARDROBE ITEMS (ORGANIZED BY CATEGORY):

TOPS (shirts, blouses, sweaters, etc.):
${topsList || 'None available'}

BOTTOMS (pants, jeans, skirts, shorts, etc.):
${bottomsList || 'None available'}

SHOES (footwear):
${shoesList || 'None available'}

ACCESSORIES (jackets, hats, sunglasses, etc.):
${accessoriesList || 'None available'}

TASK:
Generate 3 complete outfit combinations. Each outfit MUST have:
1. ONE item from TOPS (topId)
2. ONE item from BOTTOMS (bottomId)
3. ONE item from SHOES (shoesId)
4. OPTIONALLY: ONE item from ACCESSORIES (accessoryId)

CRITICAL RULES:
${selectedItemId ? `- ${pieceType === 'top' ? 'topId MUST always be ' + selectedItemId : pieceType === 'bottom' ? 'bottomId MUST always be ' + selectedItemId : 'shoesId MUST always be ' + selectedItemId} (the selected piece featured in all 3 outfits)
- The other two non-featured categories must vary across the 3 outfits
- Use different items in the non-featured slots for each of the 3 outfits` : `- topId MUST be an ID from the TOPS section ONLY
- bottomId MUST be an ID from the BOTTOMS section ONLY
- shoesId MUST be an ID from the SHOES section ONLY
- DO NOT use the same item ID in multiple outfits`}
- accessoryId MUST be an ID from ACCESSORIES (or null)
- Each outfit must score between 75-95 (vary the scores)
- "whyItWorks" must ONLY mention items you actually selected
- When writing "whyItWorks", reference specific STYLE GUIDE principles:
  * Color relationships (e.g., "complementary sage and rust", "analogous blues", "monochromatic grays")
  * Texture pairing (e.g., "smooth cotton with textured wool", "matte + shiny contrast")
  * Visual weight distribution (e.g., "dark heavy jeans balanced by light airy blouse")
  * Silhouette harmony (e.g., "fitted top with loose trousers creates balanced proportion")
  * Formality consistency (e.g., "business casual across all pieces")
  * Pattern scale (if applicable, e.g., "small-scale stripe with large-scale print")

Scoring guide (Reference STYLE_GUIDE.md principles):

COLOR HARMONY (30 points):
- Complementary colors (high contrast, vibrant) = 28-30 pts
- Analogous colors (harmonious, 30-60° on color wheel) = 26-28 pts
- Monochromatic (one color, varying shades/tones) = 25-27 pts
- Triadic (three equally spaced colors, balanced) = 24-26 pts
- Achromatic (black, white, gray neutrals) = 22-25 pts
- Color value contrast (light vs dark for silhouette definition) = +2-3 pts bonus
- Undertone matching (warm with warm, cool with cool) = +1-2 pts bonus

VISUAL WEIGHT BALANCE (25 points):
- Balanced distribution (heavy + light across pieces) = 23-25 pts
- Color weight (dark colors = heavier; light = lighter) = part of balance
- Texture weight (rough/thick = heavy; smooth/thin = light) = part of balance
- Pattern complexity (busy = heavier than solid) = part of balance
- Unbalanced weight (all heavy bottom or all light top) = 10-18 pts penalty

TEXTURE & PATTERN MATCHING (20 points):
- Intentional texture mixing (smooth + rough, matte + shiny) = 18-20 pts
- Pattern scale compatibility (small + large, NOT medium + medium) = 16-18 pts
- Pattern bridge (shared color between patterns) = +2 pts bonus
- Monochromatic textures (texture-only interest, no pattern clash) = 15-17 pts
- Formality alignment (casual patterns with casual, business with business) = +1-2 pts bonus

SILHOUETTE HARMONY (15 points):
- Fitted + loose balance (not all fitted, not all loose) = 13-15 pts
- Proportion break intentionality (cropped with high-waist, oversized with belt) = +1-2 pts bonus
- No competing silhouettes (clear line flow, not chaotic) = part of score
- Length balance (shirt/pants hemlines create proportion) = +1 pt bonus

FORMALITY CONSISTENCY (10 points):
- All pieces same formality level (casual-casual, business-business) = 10 pts
- Adjacent levels acceptable (business casual + casual = +1 level ok) = 8-9 pts
- Clashing formality (formal + casual) = 0-3 pts penalty

Return ONLY valid JSON (no markdown, no backticks):
{
  "outfits": [
    {
      "topId": "item_xxx",
      "bottomId": "item_yyy",
      "shoesId": "item_zzz",
      "outerwearId": null,
      "accessoryId": null,
      "matchScore": 88,
      "whyItWorks": "The sage green shirt with navy chinos creates a sophisticated, earthy palette. The tan loafers complete the business casual look with warm grounding.",
      "occasions": ["creative office", "casual brunch"],
      "missingItems": []
    }
  ]
}`,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (typeof content === 'string') {
      try {
        let jsonContent = content.trim()
        if (jsonContent.startsWith('```json')) {
          jsonContent = jsonContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (jsonContent.startsWith('```')) {
          jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }

        const parsed = JSON.parse(jsonContent)
        return parsed.outfits || []
      } catch (parseError) {
        console.error('[generateOutfitSuggestions] Parse error:', parseError)
        return getOutfitFallback(selectedColor, selectedFormality)
      }
    }

    return getOutfitFallback(selectedColor, selectedFormality)
  } catch (error) {
    console.error('[generateOutfitSuggestions] Error:', error)
    throw error
  }
}

function getOutfitFallback(color: string, formality: string) {
  return [
    {
      topId: '',
      bottomId: '',
      shoesId: '',
      outerwearId: null,
      accessoryId: null,
      matchScore: 75,
      whyItWorks: `These pieces create a ${formality} ensemble with complementary styling.`,
      occasions: ['casual outing', 'everyday wear'],
      missingItems: ['Unable to generate outfit - wardrobe may be empty'],
    },
  ]
}

export { client }
