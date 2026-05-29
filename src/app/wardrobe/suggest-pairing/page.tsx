'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/apiFetch'
import type { Suggestion } from '@/types'

interface UploadedItem {
  detected_type: string
  color: string
  formality: string
  material: string
  fit: string
  silhouette: string
  visual_weight: string
}

export default function SuggestPairingPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedItem, setUploadedItem] = useState<UploadedItem | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setSuggestions([])
    setUploadedItem(null)

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

  const handleSuggestPairings = async () => {
    if (!imagePreview) {
      setError('Please upload an image first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch('/api/wardrobe/suggest-pairing', {
        method: 'POST',
        body: JSON.stringify({
          image: imagePreview,
          mediaType: mediaType || 'image/jpeg',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get pairing suggestions')
      }

      setUploadedItem(data.uploadedItem)
      setSuggestions(data.suggestions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get pairing suggestions')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setImagePreview(null)
    setMediaType(null)
    setUploadedItem(null)
    setSuggestions([])
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Header */}
      <div className="border-b border-divider">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-bold text-primary mb-2">Suggest Pairing</h1>
          <p className="text-text-secondary">Upload a clothing item to find what goes with it</p>
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
              <div className="text-5xl mb-4">📷</div>
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
        {imagePreview && !uploadedItem && (
          <div className="mb-12">
            <button
              onClick={handleSuggestPairings}
              disabled={loading}
              className="w-full px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark transition-colors duration-150 disabled:opacity-50"
            >
              {loading ? '⟳ Analyzing...' : '✓ Find Pairings'}
            </button>
          </div>
        )}

        {/* Uploaded Item Analysis */}
        {uploadedItem && (
          <div className="mb-12 p-6 bg-surface-elevated border border-divider rounded-lg">
            <h2 className="text-xl font-semibold text-primary mb-6">Uploaded Item</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-medium">Type</span>
                <span className="text-text-primary capitalize">{uploadedItem.detected_type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-medium">Color</span>
                <span className="text-text-primary">{uploadedItem.color}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-medium">Material</span>
                <span className="text-text-primary">{uploadedItem.material}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-medium">Formality</span>
                <span className="text-text-primary capitalize">{uploadedItem.formality}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-medium">Fit</span>
                <span className="text-text-primary capitalize">{uploadedItem.fit}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-medium">Silhouette</span>
                <span className="text-text-primary capitalize">{uploadedItem.silhouette}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-medium">Visual Weight</span>
                <span className="text-text-primary capitalize">{uploadedItem.visual_weight}</span>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-primary mb-6">Suggested Pairings</h2>
            <div className="space-y-4">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-4 bg-surface-elevated border border-divider rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-sm font-semibold text-primary">
                        {suggestion.item.color && (suggestion.item as any).item_type
                          ? `${suggestion.item.color} ${(suggestion.item as any).item_type}`
                          : (suggestion.item as any).item_type || 'Suggested item'}
                      </p>
                      {suggestion.item.material && (
                        <p className="text-xs text-text-secondary mt-1">{suggestion.item.material}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-accent">{suggestion.matchScore}%</div>
                      <div className="text-xs text-text-secondary">Match</div>
                    </div>
                  </div>
                  <p className="text-sm text-text-primary">{suggestion.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Suggestions Message */}
        {uploadedItem && suggestions.length === 0 && !loading && (
          <div className="mb-12 p-6 bg-surface-elevated border border-divider rounded-lg text-center">
            <p className="text-text-secondary">No matching items found in your wardrobe</p>
            <p className="text-sm text-text-secondary mt-2">
              Upload more items to get pairing suggestions
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {uploadedItem && (
          <div className="flex gap-3 pt-6 border-t border-divider">
            <button
              onClick={handleReset}
              className="px-6 py-3 border border-border text-primary font-medium rounded-lg hover:bg-surface-hover transition-colors duration-150"
            >
              Try Another
            </button>
            <Link
              href="/wardrobe/gallery"
              className="flex-1 px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark transition-colors duration-150 text-center"
            >
              View Wardrobe
            </Link>
          </div>
        )}

        {/* Empty State */}
        {!imagePreview && !uploadedItem && (
          <div className="text-center py-12">
            <p className="text-text-secondary">Select an image to get pairing suggestions</p>
          </div>
        )}
      </div>
    </div>
  )
}
