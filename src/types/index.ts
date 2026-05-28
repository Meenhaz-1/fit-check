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
