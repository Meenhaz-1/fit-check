import OpenAI from 'openai'
import { cleanAndParseJSON, getBase64 } from '@/lib/validation'
import {
  parseClothingDetectionResponse,
  parseMetadataResponse,
  createFallback,
  categorizeItemType,
} from '@/lib/ai-utils'
import { PROMPTS } from '@/config/prompts'
import {
  calculateFitCompatibility,
  getFitPairingRecommendations,
  type FitType,
} from '@/lib/fit-compatibility'

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
              text: PROMPTS.detectClothing,
            },
          ],
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    return typeof content === 'string' ? parseClothingDetectionResponse(content) : []
  } catch (error) {
    console.error('Clothing detection failed:', error)
    throw error
  }
}

export async function extractMetadata(
  imageBase64: string,
  items: string | string[],
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg'
): Promise<Record<string, string> | Record<string, string>[]> {
  try {
    const base64Only = getBase64(imageBase64)
    const isMultiple = Array.isArray(items)
    const selectedItems = isMultiple ? items : [items]

    const prompt = isMultiple
      ? PROMPTS.extractMetadataMultiple(selectedItems, selectedItems.length)
      : PROMPTS.extractMetadata(selectedItems[0])

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: isMultiple ? 1024 : 256,
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
              text: prompt,
            },
          ],
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (typeof content === 'string') {
      if (isMultiple) {
        try {
          const metadataArray = cleanAndParseJSON(content) as Record<string, string> | Record<string, string>[]
          return Array.isArray(metadataArray) ? metadataArray : [metadataArray]
        } catch {
          return selectedItems.map(() => createFallback('metadata'))
        }
      } else {
        try {
          return cleanAndParseJSON(content) as Record<string, string>
        } catch {
          return createFallback('metadata')
        }
      }
    }

    return isMultiple ? selectedItems.map(() => createFallback('metadata')) : createFallback('metadata')
  } catch (error) {
    console.error('Metadata extraction failed:', error)
    throw error
  }
}

export async function suggestPairings(
  uploadedItemAnalysis: Record<string, string>,
  wardrobeItems: Array<Record<string, unknown>>,
  includeDetailedAnalysis: boolean = true
): Promise<
  Array<{
    item: Record<string, unknown>
    reason: string
    matchScore: number
    whatWorksWell?: string[]
    whatCouldImprove?: string[]
    stylingTips?: string[]
  }>
> {
  try {
    console.log(`[suggestPairings] Received ${wardrobeItems.length} wardrobe items`)

    if (wardrobeItems.length === 0) {
      console.log('[suggestPairings] No wardrobe items, using generic suggestions')
      return await getGenericPairingSuggestions(uploadedItemAnalysis)
    }

    const uploadedFit = (uploadedItemAnalysis.fit || 'regular') as FitType
    const uploadedType = categorizeItemType(uploadedItemAnalysis.detected_type || uploadedItemAnalysis.item_type || '')

    const wardrobeItemsList = wardrobeItems
      .map(
        (item, idx) =>
          `${idx}: ${item.color} ${item.item_type || 'item'} (fit: ${item.fit || 'regular'}, ${item.formality}, ${item.material})`
      )
      .join('\n')

    const prompt = includeDetailedAnalysis
      ? PROMPTS.suggestPairingsDetailed(uploadedItemAnalysis, wardrobeItemsList)
      : PROMPTS.suggestPairings(uploadedItemAnalysis, wardrobeItemsList)

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: includeDetailedAnalysis ? 2048 : 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (typeof content === 'string') {
      try {
        const suggestions = cleanAndParseJSON(content) as Array<{
          item_index: number
          reason: string
          matchScore: number
          whatWorksWell?: string[]
          whatCouldImprove?: string[]
          stylingTips?: string[]
        }>
        return suggestions.map(
          (s: {
            item_index: number
            reason: string
            matchScore: number
            whatWorksWell?: string[]
            whatCouldImprove?: string[]
            stylingTips?: string[]
          }) => {
            const suggestionItem = wardrobeItems[s.item_index]
            const suggestionFit = (suggestionItem.fit || 'regular') as FitType
            const suggestionType = categorizeItemType(suggestionItem.item_type as string)

            let adjustedMatchScore = s.matchScore
            let fitNote = ''

            // Apply fit compatibility adjustments (only for top/bottom pairings)
            if (
              (uploadedType === 'top' && suggestionType === 'bottom') ||
              (uploadedType === 'bottom' && suggestionType === 'top')
            ) {
              const fitCompat = calculateFitCompatibility(uploadedFit, suggestionFit)
              fitNote = ` | Fit pairing: ${fitCompat.reasoning}`

              // Adjust score based on fit compatibility
              if (fitCompat.score > 85) {
                adjustedMatchScore = Math.min(100, adjustedMatchScore + 10)
              } else if (fitCompat.score < 40) {
                adjustedMatchScore = Math.max(0, adjustedMatchScore - 15)
              }

              if (fitCompat.warning) {
                fitNote += ` ${fitCompat.warning}`
              }
            }

            return {
              item: suggestionItem,
              reason: s.reason + fitNote,
              matchScore: adjustedMatchScore,
              ...(s.whatWorksWell && { whatWorksWell: s.whatWorksWell }),
              ...(s.whatCouldImprove && { whatCouldImprove: s.whatCouldImprove }),
              ...(s.stylingTips && { stylingTips: s.stylingTips }),
            }
          }
        )
      } catch (parseError) {
        console.error('[suggestPairings] Parse error:', parseError)
        return await getGenericPairingSuggestions(uploadedItemAnalysis)
      }
    }

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
    const itemType = uploadedItemAnalysis.detected_type || uploadedItemAnalysis.item_type || 'clothing item'
    const formality = uploadedItemAnalysis.formality || 'casual'

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `You are a fashion stylist. A user has uploaded an item but has an empty wardrobe. Suggest 3 generic clothing items that would pair well with their uploaded item.

UPLOADED ITEM:
- Type: ${itemType}
- Color: ${uploadedItemAnalysis.color}
- Material: ${uploadedItemAnalysis.material}
- Formality: ${formality}
- Fit: ${uploadedItemAnalysis.fit}
- Silhouette: ${uploadedItemAnalysis.silhouette}
- Visual Weight: ${uploadedItemAnalysis.visual_weight}

Suggest 3 generic clothing items (complementary types, NOT the same type or complete outfit replacements) that would pair well.

CRITICAL CONSTRAINTS:
- Do NOT suggest another ${itemType}
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

Return ONLY valid JSON, no markdown:
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
        const suggestions = cleanAndParseJSON(content) as Array<{
          item_type: string
          reason: string
          matchScore: number
        }>
        return suggestions.map(
          (s: { item_type: string; reason: string; matchScore: number }) => ({
            item: { item_type: s.item_type, formality },
            reason: s.reason,
            matchScore: s.matchScore,
          })
        )
      } catch (parseError) {
        console.error('[getGenericPairingSuggestions] Parse error:', parseError)
        return createFallback('pairing', uploadedItemAnalysis) as Array<{
          item: Record<string, unknown>
          reason: string
          matchScore: number
        }>
      }
    }

    return createFallback('pairing', uploadedItemAnalysis) as Array<{
      item: Record<string, unknown>
      reason: string
      matchScore: number
    }>
  } catch (error) {
    console.error('[getGenericPairingSuggestions] Error:', error)
    return createFallback('pairing', uploadedItemAnalysis) as Array<{
      item: Record<string, unknown>
      reason: string
      matchScore: number
    }>
  }
}

export async function evaluateOutfit(
  detectedItems: Array<{ type: string; color: string; material: string; formality: string; fit: string; silhouette: string; visual_weight: string }>,
  persona: string = 'minimalist',
  userProfile?: {
    id: string
    name: string
    gender?: string
    buildType?: string
    skinAnalysis?: {
      skinTone: string
      undertone: string
      confidence: number
    }
    colorPalettes?: {
      aiSuggested?: string[]
      userSelected?: string
    }
    aesthetics?: string[]
    formality?: string
    paletteAffinity?: string
  }
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
  profileSpecificFeedback?: string
}> {
  try {
    const itemsList = detectedItems
      .map((item, idx) => `${idx + 1}. ${item.color} ${item.type} (${item.material}, ${item.formality}, ${item.fit}, ${item.silhouette}, ${item.visual_weight})`)
      .join('\n')
    const isSingleItem = detectedItems.length === 1

    const prompt = PROMPTS.evaluateOutfit(itemsList, isSingleItem, persona, detectedItems, userProfile)
    console.log('[evaluateOutfit] USER PROFILE:', userProfile ? { name: userProfile.name, skinTone: userProfile.skinAnalysis?.skinTone, buildType: userProfile.buildType } : 'NONE')
    console.log('[evaluateOutfit] PROMPT INCLUDES profileSpecificFeedback:', prompt.includes('profileSpecificFeedback'))
    console.log('[evaluateOutfit] PROMPT (first 500 chars):', prompt.substring(0, 500))

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    console.log('[evaluateOutfit] RESPONSE (raw):', typeof content === 'string' ? content.substring(0, 500) : 'NOT STRING')

    if (typeof content === 'string') {
      try {
        const parsed = cleanAndParseJSON(content)
        console.log('[evaluateOutfit] PARSED KEYS:', Object.keys(parsed))
        console.log('[evaluateOutfit] HAS profileSpecificFeedback:', 'profileSpecificFeedback' in parsed)
        return parsed
      } catch (parseError) {
        console.error('[evaluateOutfit] Parse error:', parseError)
        console.error('[evaluateOutfit] Content that failed to parse:', content)
        return createFallback('evaluation') as any
      }
    }

    return createFallback('evaluation') as any
  } catch (error) {
    console.error('[evaluateOutfit] Error:', error)
    throw error
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

Return ONLY valid JSON:
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
}`,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (typeof content === 'string') {
      try {
        return cleanAndParseJSON(content)
      } catch (parseError) {
        console.error('[analyzePairingDetailed] Parse error:', parseError)
        return createFallback('pairing') as any
      }
    }

    return createFallback('pairing') as any
  } catch (error) {
    console.error('[analyzePairingDetailed] Error:', error)
    throw error
  }
}

export async function generateOutfitSuggestions(
  selectedPieceMetadata: Record<string, string>,
  wardrobeItems: any[],
  pieceType: 'top' | 'bottom' | 'shoes',
  selectedItemId?: string
) {
  try {
    const tops = wardrobeItems.filter(item => categorizeItemType(item.item_type) === 'top')
    const bottoms = wardrobeItems.filter(item => categorizeItemType(item.item_type) === 'bottom')
    const shoes = wardrobeItems.filter(item => categorizeItemType(item.item_type) === 'shoes')
    const accessories = wardrobeItems.filter(item => categorizeItemType(item.item_type) === 'accessory')

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
          // Use description if available, otherwise fall back to item_type
          const description = item.description || item.item_type || 'clothing item'
          return `ID:${item.id} | ${description} | Color:${color} | Material:${material} | Formality:${formality} | Weight:${weight} | Fit:${fit} | Silhouette:${silhouette}`
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
          content: PROMPTS.generateOutfits(selectedItemConstraint, topsList, bottomsList, shoesList, accessoriesList),
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (typeof content === 'string') {
      try {
        const parsed = cleanAndParseJSON(content)
        return parsed.outfits || []
      } catch (parseError) {
        console.error('[generateOutfitSuggestions] Parse error:', parseError)
        return createFallback('outfit', { formality: selectedFormality }) as any
      }
    }

    return createFallback('outfit', { formality: selectedFormality }) as any
  } catch (error) {
    console.error('[generateOutfitSuggestions] Error:', error)
    throw error
  }
}

export { client }
