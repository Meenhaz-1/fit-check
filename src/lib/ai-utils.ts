import { cleanAndParseJSON } from '@/lib/validation'

export function categorizeItemType(itemType: string): 'top' | 'bottom' | 'shoes' | 'accessory' | 'unknown' {
  const lower = (itemType || '').toLowerCase()

  if (
    lower.includes('shirt') ||
    lower.includes('blouse') ||
    lower.includes('t-shirt') ||
    lower.includes('sweater') ||
    lower.includes('sweatshirt') ||
    lower.includes('cardigan') ||
    lower.includes('polo') ||
    lower.includes('vest') ||
    lower.includes('top')
  ) {
    return 'top'
  }

  if (
    lower.includes('pant') ||
    lower.includes('jean') ||
    lower.includes('trouser') ||
    lower.includes('skirt') ||
    lower.includes('short') ||
    lower.includes('legging') ||
    lower.includes('cargo')
  ) {
    return 'bottom'
  }

  if (
    lower.includes('shoe') ||
    lower.includes('boot') ||
    lower.includes('sneaker') ||
    lower.includes('loafer') ||
    lower.includes('sandal') ||
    lower.includes('heel') ||
    lower.includes('flat') ||
    lower.includes('pump') ||
    lower.includes('oxford')
  ) {
    return 'shoes'
  }

  if (
    lower.includes('jacket') ||
    lower.includes('blazer') ||
    lower.includes('coat') ||
    lower.includes('hat') ||
    lower.includes('cap') ||
    lower.includes('sunglasses') ||
    lower.includes('glasses') ||
    lower.includes('bag') ||
    lower.includes('scarf')
  ) {
    return 'accessory'
  }

  return 'unknown'
}

export function parseClothingDetectionResponse(content: string): string[] {
  return content.split('\n').filter((line) => line.trim().length > 0)
}

export function parseMetadataResponse(content: string): Record<string, string> {
  try {
    return cleanAndParseJSON(content)
  } catch {
    return parseMetadataFromText(content)
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

export type FallbackType = 'metadata' | 'pairing' | 'evaluation' | 'outfit'

export function createFallback(type: FallbackType, context?: Record<string, string>): any {
  const formality = context?.formality || 'casual'

  switch (type) {
    case 'metadata':
      return {
        color: 'unknown',
        material: 'unknown',
        formality: 'casual',
        fit: 'regular',
        silhouette: 'straight',
        visual_weight: 'medium',
      }

    case 'pairing':
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

    case 'evaluation':
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
          accessories: [
            'Minimal jewelry that doesn\'t compete with the piece',
            'Belt or watch in a complementary tone',
            'Structured bag that matches the formality level',
          ],
        },
        verdict: 'Maybe',
        verdictReasoning:
          'The item shows solid design fundamentals. Purchase if the color and style fit your existing wardrobe and lifestyle. Consider passing if you need higher versatility or different formality level.',
        colorHarmony: 72,
        proportionBalance: 75,
        formalityAlignment: 70,
        overallCohesion: 71,
      }

    case 'outfit':
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

    default:
      return null
  }
}
