export interface WardrobeItem {
  id: string
  filename: string
  color: string
  material: string
  formality: string
  fit: string
  silhouette: string
  visualWeight: string
  uploadedAt: string
  metadata?: Record<string, unknown>
}

export interface Evaluation {
  id: string
  itemFilename: string
  verdict: 'Buy' | 'Maybe' | 'Do Not Buy'
  reasoning: string
  pairings: EvaluationPairing[]
  createdAt: string
}

export interface EvaluationPairing {
  wardrobeItemId: string
  compatibilityScore: number
  explanation: string
}

export interface Suggestion {
  item: WardrobeItem
  reason: string
  matchScore: number
}

export interface DetailedSuggestion extends Suggestion {
  whatWorksWell?: string[]
  whatCouldImprove?: string[]
  stylingTips?: string[]
}

export interface SuggestPairingRequest {
  image: string
  mediaType?: string
}

export interface SuggestPairingResponse {
  success: boolean
  uploadedItem?: {
    detected_type: string
    color: string
    formality: string
    material: string
    fit: string
    silhouette: string
    visual_weight: string
  }
  suggestions?: Suggestion[]
  error?: string
  timestamp: string
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export interface EvaluationAnalysis {
  whatWorksWell: string[]
  whatCouldImprove: string[]
  specificStylingRecommendations: string[]
  verdict?: 'Buy' | 'Maybe' | 'Do Not Buy'
  verdictReasoning?: string
  occasions: string[]
  colorHarmony: number  // 0-100
  proportionBalance: number  // 0-100
  formalityAlignment: number  // 0-100
  overallCohesion: number  // 0-100
  profileSpecificFeedback?: string  // Detailed feedback on how well the outfit works for the specific person's profile
}

export interface EvaluateItemRequest {
  image: string
  mediaType?: string
}

export interface EvaluateItemResponse {
  success: boolean
  detectedItems?: string[]
  evaluation?: EvaluationAnalysis
  error?: string
  timestamp: string
}

export interface OutfitItem {
  id: string
  item_type: string
  color: string
  material: string
  visual_weight: string
  imageUrl?: string
}

export interface OutfitSuggestion {
  id: number
  top: OutfitItem
  bottom: OutfitItem
  shoes: OutfitItem
  outerwear?: OutfitItem | null
  accessory?: OutfitItem | null
  matchScore: number  // 0-100
  whyItWorks: string
  occasions: string[]
  missingItems: string[]
}

export interface OutfitBuilderRequest {
  image?: string
  itemId?: string
  itemType?: 'top' | 'bottom' | 'shoes'
  mediaType?: string
}

export interface OutfitBuilderResponse {
  success: boolean
  detectedPiece?: {
    type: string
    metadata: Record<string, string>
  }
  outfitSuggestions?: OutfitSuggestion[]
  error?: string
  timestamp: string
}
