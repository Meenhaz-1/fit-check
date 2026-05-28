// Wardrobe Item
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

// Evaluation
export interface Evaluation {
  id: string
  itemFilename: string
  verdict: 'Buy' | 'Maybe' | 'Do Not Buy'
  reasoning: string
  pairings: EvaluationPairing[]
  createdAt: string
}

// Pairing Recommendation
export interface EvaluationPairing {
  wardrobeItemId: string
  compatibilityScore: number
  explanation: string
}

// Metadata from AI
export interface ExtractedMetadata {
  color: string
  material: string
  formality: string
  fit: string
  silhouette: string
  visualWeight: string
}

// API Response Types
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
