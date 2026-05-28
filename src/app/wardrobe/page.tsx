'use client'

import { useState, useRef, useEffect } from 'react'
import type { ExtractedMetadata } from '@/lib/metadata'
import { apiFetch } from '@/lib/apiFetch'

interface MetadataFormState {
  filename: string
  item_type: string
  color: string
  material: string
  formality: string
  fit: string
  silhouette: string
  visual_weight: string
}

export default function WardrobePage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<MetadataFormState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [detectedItems, setDetectedItems] = useState<string[]>([])
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [extracting, setExtracting] = useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(null)
    setDetectedItems([])
    setSelectedItem('')

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      setImagePreview(base64)
      setMediaType(file.type || 'image/jpeg')

      setMetadata({
        filename: file.name,
        item_type: '',
        color: '',
        material: '',
        formality: '',
        fit: '',
        silhouette: '',
        visual_weight: '',
      })

      try {
        const response = await apiFetch('/api/wardrobe/detect', {
          method: 'POST',
          body: JSON.stringify({
            image: base64,
            mediaType: file.type || 'image/jpeg',
          }),
        })

        const data = await response.json()
        if (response.ok && data.items && data.items.length > 0) {
          setDetectedItems(data.items)
          setSelectedItem(data.items[0])
        }
      } catch (err) {
        console.error('Error detecting items:', err)
      }
    }

    reader.readAsDataURL(file)
  }

  const handleExtractMetadata = async () => {
    if (!imagePreview || !metadata) {
      setError('Please select an image first')
      return
    }

    setExtracting(true)
    setError(null)

    try {
      const response = await apiFetch('/api/wardrobe/upload', {
        method: 'POST',
        body: JSON.stringify({
          image: imagePreview,
          mediaType: 'image/jpeg',
          itemDescription: selectedItem || 'clothing item',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract metadata')
      }

      setMetadata({
        ...metadata,
        ...data.metadata,
      })
      setSuccess('✓ Metadata extracted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract metadata')
    } finally {
      setExtracting(false)
    }
  }

  const handleMetadataChange = (field: keyof Omit<MetadataFormState, 'filename'>, value: string) => {
    if (!metadata) return
    setMetadata({ ...metadata, [field]: value })
  }

  const handleSave = async () => {
    if (!metadata) {
      setError('No metadata to save')
      return
    }

    const requiredFields = ['item_type', 'color', 'material', 'formality', 'fit', 'silhouette', 'visual_weight']
    for (const field of requiredFields) {
      if (!metadata[field as keyof MetadataFormState]) {
        setError(`Missing: ${field}`)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch('/api/wardrobe/save', {
        method: 'POST',
        body: JSON.stringify({
          ...metadata,
          image: imagePreview,
          mediaType: mediaType || 'image/jpeg',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save item')
      }

      setSuccess('✓ Item saved successfully')
      setTimeout(() => {
        setImagePreview(null)
        setMediaType(null)
        setMetadata(null)
        setDetectedItems([])
        setSelectedItem('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Header */}
      <div className="border-b border-divider">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h1 className="text-4xl font-bold text-primary mb-2">Add to Wardrobe</h1>
          <p className="text-text-secondary">Upload a photo and let AI extract the details</p>
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
                setMetadata(null)
                setDetectedItems([])
                setSelectedItem('')
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

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-success rounded-lg">
            <p className="text-sm font-medium text-success">{success}</p>
          </div>
        )}

        {/* Detected Items */}
        {detectedItems.length > 0 && (
          <div className="mb-8 p-4 bg-surface-elevated border border-divider rounded-lg">
            <label className="block text-sm font-medium text-primary mb-3">
              What did AI detect? (Select one)
            </label>
            <div className="space-y-2">
              {detectedItems.map((item) => (
                <label key={item} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-surface-hover">
                  <input
                    type="radio"
                    name="detected-item"
                    value={item}
                    checked={selectedItem === item}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-text-primary">{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Form */}
        {metadata && (
          <div className="space-y-8">
            {/* AI Extract Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-primary">Item Details</h2>
              <button
                onClick={handleExtractMetadata}
                disabled={extracting}
                className="px-6 py-2 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark transition-colors duration-150 disabled:opacity-50"
              >
                {extracting ? '⟳ Analyzing...' : '✓ Auto-fill with AI'}
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Item Type */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Item Type *
                </label>
                <input
                  type="text"
                  value={metadata.item_type}
                  onChange={(e) => handleMetadataChange('item_type', e.target.value)}
                  placeholder="e.g., T-shirt, Blazer, Jeans"
                  className="w-full px-4 py-3 border border-border rounded-lg text-base focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Color *
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={metadata.color}
                    onChange={(e) => handleMetadataChange('color', e.target.value)}
                    placeholder="e.g., Navy, White, Burgundy"
                    className="flex-1 px-4 py-3 border border-border rounded-lg text-base focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                  <div
                    className="w-16 h-12 rounded-lg border border-border shadow-sm flex-shrink-0"
                    style={{ backgroundColor: metadata.color || '#f0f0f0' }}
                    title="Color preview"
                  />
                </div>
              </div>

              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Material *
                </label>
                <input
                  type="text"
                  value={metadata.material}
                  onChange={(e) => handleMetadataChange('material', e.target.value)}
                  placeholder="e.g., Cotton, Wool, Silk blend"
                  className="w-full px-4 py-3 border border-border rounded-lg text-base focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              {/* Formality */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Formality Level *
                </label>
                <select
                  value={metadata.formality}
                  onChange={(e) => handleMetadataChange('formality', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg text-base focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Select formality level</option>
                  <option value="casual">Casual</option>
                  <option value="business casual">Business Casual</option>
                  <option value="business">Business</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              {/* Fit */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Fit *
                </label>
                <select
                  value={metadata.fit}
                  onChange={(e) => handleMetadataChange('fit', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg text-base focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Select fit</option>
                  <option value="fitted">Fitted</option>
                  <option value="regular">Regular</option>
                  <option value="loose">Loose</option>
                  <option value="oversize">Oversize</option>
                </select>
              </div>

              {/* Silhouette */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Silhouette *
                </label>
                <input
                  type="text"
                  value={metadata.silhouette}
                  onChange={(e) => handleMetadataChange('silhouette', e.target.value)}
                  placeholder="e.g., Straight, A-line, Tapered"
                  className="w-full px-4 py-3 border border-border rounded-lg text-base focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              {/* Visual Weight */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Visual Weight *
                </label>
                <select
                  value={metadata.visual_weight}
                  onChange={(e) => handleMetadataChange('visual_weight', e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-lg text-base focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Select visual weight</option>
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t border-divider">
              <button
                onClick={() => {
                  setImagePreview(null)
                  setMediaType(null)
                  setMetadata(null)
                  setDetectedItems([])
                  setSelectedItem('')
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="px-6 py-3 border border-border text-primary font-medium rounded-lg hover:bg-surface-hover transition-colors duration-150"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark transition-colors duration-150 disabled:opacity-50"
              >
                {loading ? '⟳ Saving...' : 'Save Item'}
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!metadata && !imagePreview && (
          <div className="text-center py-12">
            <p className="text-text-secondary">Select an image to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
