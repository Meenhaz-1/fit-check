'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/apiFetch'
import type { EvaluationAnalysis } from '@/types'

interface EvaluationResult {
  detectedItems: string[]
  evaluation: EvaluationAnalysis
  evaluationId: string
}

export default function EvaluateItemPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [showVerdictOnly, setShowVerdictOnly] = useState(true)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setResult(null)

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = e.target?.result as string
      setImagePreview(base64)
      setMediaType(file.type || 'image/jpeg')
    }

    reader.readAsDataURL(file)
  }

  const handleEvaluate = async () => {
    if (!imagePreview) {
      setError('Please upload an image first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch('/api/wardrobe/evaluate-item', {
        method: 'POST',
        body: JSON.stringify({
          image: imagePreview,
          mediaType: mediaType || 'image/jpeg',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to evaluate outfit')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate outfit')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setImagePreview(null)
    setMediaType(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-surface-base">
        {/* Header */}
        <div className="border-b border-divider">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <h1 className="text-4xl font-bold text-primary mb-2">Evaluate Outfit</h1>
            <p className="text-text-secondary">Upload a photo of your styled outfit for professional styling feedback</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Upload Area */}
          {!imagePreview ? (
            <label className="block mb-12">
              <div className="border-2 border-divider rounded-lg p-12 text-center cursor-pointer hover:border-accent transition-colors duration-150">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
                <div className="text-5xl mb-4">📸</div>
                <p className="text-lg font-semibold text-primary mb-2">Click to upload or drag and drop</p>
                <p className="text-sm text-text-secondary">JPG, PNG, GIF up to 10MB</p>
              </div>
            </label>
          ) : (
            <div className="mb-12">
              <div className="rounded-lg border border-divider shadow-sm bg-gray-100 p-4">
                <img src={imagePreview} alt="Preview" className="w-full h-auto object-contain" />
              </div>
              <button
                onClick={() => {
                  setImagePreview(null)
                  setMediaType(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="mt-4 text-accent hover:text-accent-dark text-sm font-medium transition-colors"
              >
                ← Change image
              </button>
            </div>
          )}

          {/* Status Messages */}
          {error && (
            <div className="mb-6 p-4 bg-error-bg border border-error rounded-lg">
              <p className="text-sm font-medium text-error">⚠ {error}</p>
            </div>
          )}

          {/* Analyze Button */}
          {imagePreview && !result && (
            <div className="mb-12">
              <button
                onClick={handleEvaluate}
                disabled={loading}
                className="w-full px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark transition-colors duration-150 disabled:opacity-50"
              >
                {loading ? '⟳ Analyzing outfit...' : '✓ Get Evaluation'}
              </button>
            </div>
          )}

          {/* Empty State */}
          {!imagePreview && !result && (
            <div className="text-center py-12">
              <p className="text-text-secondary">Upload a photo of your styled outfit to get started</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Result display
  return (
    <div className="min-h-screen bg-surface-base">
      {/* Header */}
      <div className="border-b border-divider">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-bold text-primary mb-2">Outfit Evaluation</h1>
          <p className="text-text-secondary">Complete style analysis and recommendations</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Image Preview */}
        <div className="mb-12">
          <div className="rounded-lg border border-divider shadow-sm bg-gray-100 p-4">
            <img src={imagePreview} alt="Outfit" className="w-full h-auto object-contain" />
          </div>
        </div>

        {/* Detected Items */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-primary mb-4">Detected Items</h2>
          <div className="space-y-2">
            {result.detectedItems.map((item, i) => (
              <p key={i} className="text-text-primary">• {item}</p>
            ))}
          </div>
        </div>

        {/* What Works Well */}
        <div className="mb-12 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="text-xl font-semibold text-green-900 mb-4">✓ What Works Well</h2>
          <ul className="space-y-3">
            {result.evaluation.whatWorksWell.map((point, i) => (
              <li key={i} className="text-text-primary flex gap-3">
                <span className="text-green-600 flex-shrink-0">✓</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What Could Improve */}
        <div className="mb-12 p-6 bg-orange-50 border border-orange-200 rounded-lg">
          <h2 className="text-xl font-semibold text-orange-900 mb-4">⚠ What Could Improve</h2>
          <ul className="space-y-3">
            {result.evaluation.whatCouldImprove.map((point, i) => (
              <li key={i} className="text-text-primary flex gap-3">
                <span className="text-orange-600 flex-shrink-0">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Styling Recommendations */}
        <div className="mb-12 p-6 bg-surface-elevated border border-divider rounded-lg">
          <h2 className="text-xl font-semibold text-primary mb-4">Styling Recommendations</h2>
          <ul className="space-y-3">
            {result.evaluation.specificStylingRecommendations.map((rec, i) => (
              <li key={i} className="text-text-primary flex gap-3">
                <span className="text-accent flex-shrink-0">→</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Verdict - Optional Toggle */}
        {result.evaluation.verdict && (
          <div className="mb-12">
            <button
              onClick={() => setShowVerdictOnly(!showVerdictOnly)}
              className="text-sm font-medium text-accent hover:text-accent-dark transition-colors mb-4"
            >
              {showVerdictOnly ? '▼' : '▶'} Verdict {showVerdictOnly ? '(click to hide)' : '(click to show)'}
            </button>

            {showVerdictOnly && (
              <div
                className="p-6 rounded-lg border-2"
                style={{
                  borderColor:
                    result.evaluation.verdict === 'Buy'
                      ? '#10b981'
                      : result.evaluation.verdict === 'Maybe'
                        ? '#f59e0b'
                        : '#ef4444',
                  backgroundColor:
                    result.evaluation.verdict === 'Buy'
                      ? '#f0fdf4'
                      : result.evaluation.verdict === 'Maybe'
                        ? '#fffbeb'
                        : '#fef2f2',
                }}
              >
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{
                    color:
                      result.evaluation.verdict === 'Buy'
                        ? '#065f46'
                        : result.evaluation.verdict === 'Maybe'
                          ? '#92400e'
                          : '#7f1d1d',
                  }}
                >
                  {result.evaluation.verdict}
                </h3>
                <p className="text-text-primary">{result.evaluation.verdictReasoning}</p>
              </div>
            )}
          </div>
        )}

        {/* Occasions */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-primary mb-4">Perfect For</h2>
          <div className="flex flex-wrap gap-2">
            {result.evaluation.occasions.map((occasion, i) => (
              <span key={i} className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium">
                {occasion}
              </span>
            ))}
          </div>
        </div>

        {/* Analysis Scores */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-primary mb-6">Analysis Scores</h2>
          <div className="space-y-4">
            {[
              ['Overall Cohesion', result.evaluation.overallCohesion],
              ['Color Harmony', result.evaluation.colorHarmony],
              ['Proportion Balance', result.evaluation.proportionBalance],
              ['Formality Alignment', result.evaluation.formalityAlignment],
            ].map(([label, score]) => (
              <div key={label}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-text-secondary">{label}</span>
                  <span className="text-sm font-bold text-accent">{score}%</span>
                </div>
                <div className="w-full bg-surface-elevated rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-accent rounded-full h-2.5 transition-all duration-500"
                    style={{ width: `${Math.min(score as number, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6 border-t border-divider">
          <button
            onClick={handleReset}
            className="px-6 py-3 border border-border text-primary font-medium rounded-lg hover:bg-surface-hover transition-colors duration-150"
          >
            Evaluate Another
          </button>
          <Link
            href="/wardrobe/gallery"
            className="flex-1 px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark transition-colors duration-150 text-center"
          >
            View Wardrobe
          </Link>
        </div>
      </div>
    </div>
  )
}
