/**
 * FIT COMPATIBILITY SCORING
 *
 * Senior Fashion Stylist Rules:
 * Fit proportions are critical to silhouette balance.
 * Two loose items = shapeless; two fitted items = can look stiff.
 * The goal is visual balance and definition.
 */

export type FitType = 'loose' | 'regular' | 'fitted' | 'slim' | 'oversized'

interface FitCompatibility {
  score: number // 0-100
  reasoning: string
  warning?: string
}

/**
 * FIT COMPATIBILITY MATRIX
 *
 * Senior Stylist Logic:
 * ✅ Loose Top + Fitted Bottom = EXCELLENT (shows shape below)
 * ✅ Fitted Top + Loose Bottom = EXCELLENT (shows shape above, flows below)
 * ✅ Fitted + Fitted = GOOD (clean lines, watch for stiffness)
 * ✅ Loose + Slim = GOOD (contrast and balance)
 * ❌ Loose + Loose = AVOID (creates tent silhouette, hides body)
 * ⚠️  Slim + Slim = CAUTION (can look too tight, risky)
 */
const FIT_COMPATIBILITY: Record<string, Record<string, FitCompatibility>> = {
  // Loose Top
  loose: {
    loose: {
      score: 15,
      reasoning: 'Two loose pieces create a tent silhouette — shapeless and unflattering',
      warning: '❌ AVOID: Creates bulky, undefined silhouette. Choose fitted or regular bottoms.',
    },
    regular: {
      score: 70,
      reasoning: 'Loose top with regular fit bottom provides some definition',
    },
    fitted: {
      score: 95,
      reasoning:
        'OPTIMAL: Loose top flows freely while fitted bottom defines the lower silhouette. Creates visual balance.',
    },
    slim: {
      score: 85,
      reasoning:
        'Loose top + slim bottoms creates great contrast. Slim legs define proportion without stiffness.',
    },
    oversized: {
      score: 10,
      reasoning: 'Two oversized pieces are extremely unflattering — complete loss of silhouette',
      warning: '❌ AVOID: Too shapeless. Pair oversized pieces with fitted bottoms only.',
    },
  },

  // Regular Fit Top
  regular: {
    loose: {
      score: 70,
      reasoning: 'Regular top with loose bottoms works — provides upper definition, flows below',
    },
    regular: {
      score: 75,
      reasoning: 'Two regular fit pieces create a balanced, neutral silhouette',
    },
    fitted: {
      score: 80,
      reasoning:
        'Regular top + fitted bottom = clean lines with some structure. Professional and flattering.',
    },
    slim: {
      score: 78,
      reasoning: 'Regular top with slim bottoms creates defined proportions',
    },
    oversized: {
      score: 45,
      reasoning:
        'Regular top + oversized bottom can work for relaxed looks, but less flattering for most body types',
    },
  },

  // Fitted Top
  fitted: {
    loose: {
      score: 95,
      reasoning:
        'OPTIMAL: Fitted top shows upper body shape, loose bottoms flow comfortably. Perfect balance.',
    },
    regular: {
      score: 82,
      reasoning: 'Fitted top with regular fit bottoms creates a streamlined silhouette',
    },
    fitted: {
      score: 70,
      reasoning:
        'Two fitted pieces are clean and elegant, but watch for stiffness. Works best for fitted occasions.',
    },
    slim: {
      score: 65,
      reasoning:
        'Fitted top + slim bottoms can look too tight-fitting overall. Best for athletic/casual wear.',
      warning: '⚠️  CAUTION: May emphasize every contour. Use for intentional fitted looks only.',
    },
    oversized: {
      score: 50,
      reasoning: 'Fitted top with oversized bottom creates volume imbalance — too much contrast',
    },
  },

  // Slim Fit Top
  slim: {
    loose: {
      score: 88,
      reasoning: 'Slim top + loose bottoms creates great contrast. Defines upper body, flows below.',
    },
    regular: {
      score: 80,
      reasoning: 'Slim top with regular bottoms maintains definition throughout',
    },
    fitted: {
      score: 72,
      reasoning: 'Slim + fitted can feel restrictive overall. Best for athletic/fashion-forward looks.',
    },
    slim: {
      score: 60,
      reasoning:
        'Two slim pieces emphasize every contour — can appear too tight. Use for intentional fits.',
      warning: '⚠️  CAUTION: Very form-fitting. Requires confidence and right body comfort.',
    },
    oversized: {
      score: 65,
      reasoning:
        'Slim top + oversized bottom creates interesting contrast. Draws eyes to fitted top, relaxed bottom.',
    },
  },

  // Oversized Top
  oversized: {
    loose: {
      score: 12,
      reasoning: 'Two oversized pieces create maximum shapelessness',
      warning: '❌ AVOID: No definition anywhere. Pair oversized top with fitted/slim bottoms only.',
    },
    regular: {
      score: 48,
      reasoning: 'Oversized top with regular bottoms works for relaxed styling, but less flattering',
    },
    fitted: {
      score: 78,
      reasoning:
        'Oversized top with fitted bottoms balances volume. Fitted bottom grounds the look and provides definition.',
    },
    slim: {
      score: 82,
      reasoning: 'Oversized top + slim bottoms creates proportional balance. Trendy and flattering.',
    },
    oversized: {
      score: 8,
      reasoning: 'Two oversized pieces eliminate all silhouette definition',
      warning: '❌ AVOID COMPLETELY: Works only for specific avant-garde fashion statements.',
    },
  },
}

/**
 * Calculate fit compatibility between top and bottom
 * Returns score 0-100 and styling reasoning
 */
export function calculateFitCompatibility(topFit: FitType, bottomFit: FitType): FitCompatibility {
  const compatibility = FIT_COMPATIBILITY[topFit]?.[bottomFit]

  if (!compatibility) {
    return {
      score: 50,
      reasoning: `${topFit} top with ${bottomFit} bottom — standard combination`,
    }
  }

  return compatibility
}

/**
 * Get fit pairing recommendations (senior stylist perspective)
 */
export function getFitPairingRecommendations(topFit: FitType): { ideal: FitType[]; avoid: FitType[] } {
  const recommendations: Record<FitType, { ideal: FitType[]; avoid: FitType[] }> = {
    loose: {
      ideal: ['fitted', 'slim'],
      avoid: ['loose', 'oversized'],
    },
    regular: {
      ideal: ['fitted', 'slim', 'regular'],
      avoid: ['oversized'],
    },
    fitted: {
      ideal: ['loose', 'regular'],
      avoid: ['slim'],
    },
    slim: {
      ideal: ['loose', 'regular', 'oversized'],
      avoid: ['slim'],
    },
    oversized: {
      ideal: ['fitted', 'slim'],
      avoid: ['loose', 'oversized'],
    },
  }

  return recommendations[topFit] || { ideal: ['regular'], avoid: [] }
}

/**
 * BODY TYPE CONSIDERATIONS
 * Different body types benefit from different fit pairings
 */
export type BodyType = 'pear' | 'apple' | 'hourglass' | 'rectangle' | 'inverted-triangle'

export function getFitAdviceByBodyType(bodyType: BodyType): Record<FitType, number> {
  const adviceMatrix: Record<BodyType, Record<FitType, number>> = {
    pear: {
      // Pear: wider hips — fitted tops + loose/regular bottoms to balance
      loose: 90,
      regular: 80,
      fitted: 95,
      slim: 60,
      oversized: 75,
    },
    apple: {
      // Apple: wider midsection — loose tops + fitted bottoms to draw eye down
      loose: 95,
      regular: 80,
      fitted: 50,
      slim: 40,
      oversized: 85,
    },
    hourglass: {
      // Hourglass: defined curves — fitted pieces that follow shape
      loose: 70,
      regular: 85,
      fitted: 95,
      slim: 80,
      oversized: 60,
    },
    rectangle: {
      // Rectangle: balanced — create definition with fitted + strategic volume
      loose: 85,
      regular: 80,
      fitted: 90,
      slim: 85,
      oversized: 75,
    },
    'inverted-triangle': {
      // Inverted triangle: wider shoulders — fitted tops + loose bottoms to balance
      loose: 90,
      regular: 80,
      fitted: 70,
      slim: 60,
      oversized: 65,
    },
  }

  return adviceMatrix[bodyType] || { loose: 75, regular: 80, fitted: 80, slim: 75, oversized: 70 }
}

/**
 * FORMALITY + FIT INTERACTION
 * Certain fit + formality combos work better together
 */
export function validateFitFormality(
  topFit: FitType,
  topFormality: string,
  bottomFit: FitType,
  bottomFormality: string
): { valid: boolean; score: number; note?: string } {
  const formalOutfits = ['business formal', 'evening', 'black-tie']
  const casualOutfits = ['casual', 'athleisure', 'loungewear']

  const topIsFormal = formalOutfits.some((f) => topFormality.toLowerCase().includes(f))
  const bottomIsFormal = formalOutfits.some((f) => bottomFormality.toLowerCase().includes(f))

  // Formal events need fitted pieces for polished look
  if ((topIsFormal || bottomIsFormal) && (topFit === 'loose' || topFit === 'oversized')) {
    return {
      valid: true,
      score: 60,
      note: 'Loose fits work for formal wear but may look less polished. Consider fitted alternatives.',
    }
  }

  // Casual + fitting mismatch usually works
  const topIsCasual = casualOutfits.some((f) => topFormality.toLowerCase().includes(f))
  const bottomIsCasual = casualOutfits.some((f) => bottomFormality.toLowerCase().includes(f))

  if ((topIsCasual || bottomIsCasual) && (topFit === 'slim' || topFit === 'fitted')) {
    return {
      valid: true,
      score: 85,
      note: 'Fitted pieces can work with casual wear for a modern, intentional look.',
    }
  }

  return { valid: true, score: 80 }
}

/**
 * VISUAL WEIGHT DISTRIBUTION
 * Combines fit with visual weight for holistic styling
 */
export function analyzeOutfitProportions(
  topFit: FitType,
  topVisualWeight: string,
  bottomFit: FitType,
  bottomVisualWeight: string
): {
  balanceScore: number
  analysis: string
  recommendation: string
} {
  const compatibility = calculateFitCompatibility(topFit, bottomFit)

  // Combine fit compatibility with visual weight
  const weightMap: Record<string, number> = {
    light: 1,
    medium: 2,
    heavy: 3,
    'extra-heavy': 4,
  }

  const topWeight = weightMap[topVisualWeight.toLowerCase()] || 2
  const bottomWeight = weightMap[bottomVisualWeight.toLowerCase()] || 2

  // Balance = opposite weights (light top + heavy bottom, or vice versa)
  const weightDifference = Math.abs(topWeight - bottomWeight)
  const weightBalance = (weightDifference / 3) * 100 // 0-100 scale

  // Combined score: fit compatibility (70%) + weight balance (30%)
  const balanceScore = compatibility.score * 0.7 + weightBalance * 0.3

  let analysis = `Fit compatibility: ${compatibility.reasoning}`
  let recommendation = 'This combination works well.'

  if (compatibility.score < 40) {
    recommendation = `⚠️ CAUTION: ${compatibility.warning || 'Consider reconsidering this pairing.'}`
  } else if (compatibility.score < 70) {
    recommendation = 'This works but consider alternatives for better proportions.'
  } else if (compatibility.score > 85) {
    recommendation = '✅ EXCELLENT FIT PAIRING: This is a well-proportioned outfit.'
  }

  return {
    balanceScore: Math.round(balanceScore),
    analysis,
    recommendation,
  }
}
