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
  const [metadata, setMetadata] = useState<MetadataFormState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [detectedItems, setDetectedItems] = useState<string[]>([])
  const [selectedItem, setSelectedItem] = useState<string>('')
  const [extracting, setExtracting] = useState(false)
  const [formFields, setFormFields] = useState<string[]>([])

  useEffect(() => {
    if (metadata) {
      setFormFields(['item_type', 'color', 'material', 'formality', 'fit', 'silhouette', 'visual_weight'])
    }
  }, [metadata])

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
      setSuccess('✨ AI analyzed your outfit! Review and adjust before saving.')
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
        setError(`Please fill in all fields. Missing: ${field}`)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch('/api/wardrobe/save', {
        method: 'POST',
        body: JSON.stringify(metadata),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save item')
      }

      setSuccess('🎉 Item saved to your wardrobe! Ready to add more?')
      setTimeout(() => {
        setImagePreview(null)
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

  const getFieldIcon = (field: string) => {
    const icons: Record<string, string> = {
      item_type: '👔',
      color: '🎨',
      material: '🧵',
      formality: '✨',
      fit: '👗',
      silhouette: '🎯',
      visual_weight: '⚖️',
    }
    return icons[field] || '✓'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-32 h-32 bg-primary-hot/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-40 h-40 bg-primary-joy/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="font-display text-5xl font-bold text-text-primary mb-2">
            Add to Your Style ✨
          </h1>
          <p className="text-text-secondary text-lg font-medium">
            Upload your outfit and let AI help you catalog it
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 font-medium animate-slide-up">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-8 p-4 bg-success/10 border-2 border-success rounded-lg text-success font-medium animate-slide-up">
            {success}
          </div>
        )}

        {/* Upload Area */}
        <div className="mb-12 animate-slide-up" style={{ animationDelay: '0ms' }}>
          <label className="block">
            <div className="relative p-12 bg-white rounded-2xl border-2 border-dashed border-primary-hot/30 hover:border-primary-hot hover:bg-primary-hot/5 transition-all duration-300 cursor-pointer group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="sr-only"
              />
              <div className="text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  📸
                </div>
                <p className="font-display text-xl font-bold text-text-primary mb-2">
                  Drag your outfit here
                </p>
                <p className="text-text-secondary mb-3">or click to pick from your phone</p>
                <p className="text-sm text-text-secondary">
                  Supported: JPG, PNG, GIF, WebP
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-12 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-primary-warm/20">
              <img src={imagePreview} alt="Preview" className="w-full h-auto" />
            </div>
          </div>
        )}

        {/* Detected Items */}
        {detectedItems.length > 0 && (
          <div className="mb-12 animate-slide-up p-6 bg-white rounded-2xl border-2 border-primary-joy/20 shadow-sm" style={{ animationDelay: '200ms' }}>
            <p className="font-display text-lg font-bold text-text-primary mb-4">
              What did I spot? 🔍
            </p>
            <p className="text-text-secondary text-sm mb-4">Select the main item:</p>
            <div className="space-y-3">
              {detectedItems.map((item, idx) => (
                <label
                  key={idx}
                  className="flex items-center p-3 rounded-lg hover:bg-primary-hot/5 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="detected-item"
                    value={item}
                    checked={selectedItem === item}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="w-5 h-5 accent-primary-hot"
                  />
                  <span className="ml-3 font-medium text-text-primary">{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Form */}
        {metadata && (
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="bg-white rounded-2xl border-2 border-primary-hot/10 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <p className="font-display text-2xl font-bold text-text-primary">
                  ✨ I think this is...
                </p>
                <button
                  onClick={handleExtractMetadata}
                  disabled={extracting}
                  className="px-6 py-2 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                >
                  {extracting ? (
                    <>
                      <span className="animate-spin">⟳</span>
                      Analyzing...
                    </>
                  ) : (
                    <>✨ Auto-Extract</>
                  )}
                </button>
              </div>

              <div className="space-y-6">
                {/* Item Type */}
                <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
                  <label className="block mb-2">
                    <span className="text-lg font-semibold text-text-primary">
                      {getFieldIcon('item_type')} Item Type
                    </span>
                  </label>
                  <input
                    type="text"
                    value={metadata.item_type}
                    onChange={(e) => handleMetadataChange('item_type', e.target.value)}
                    placeholder="e.g., button-up shirt, dress, jeans"
                    className="w-full px-4 py-3 border-2 border-primary-hot/20 rounded-lg focus:border-primary-hot focus:ring-2 focus:ring-primary-hot/20 focus:outline-none transition-all bg-white"
                  />
                </div>

                {/* Color */}
                <div className="animate-slide-up" style={{ animationDelay: '450ms' }}>
                  <label className="block mb-2">
                    <span className="text-lg font-semibold text-text-primary">
                      {getFieldIcon('color')} Color
                    </span>
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={metadata.color}
                      onChange={(e) => handleMetadataChange('color', e.target.value)}
                      placeholder="e.g., navy blue, cream, red"
                      className="flex-1 px-4 py-3 border-2 border-primary-hot/20 rounded-lg focus:border-primary-hot focus:ring-2 focus:ring-primary-hot/20 focus:outline-none transition-all bg-white"
                    />
                    <div
                      className="w-12 h-12 rounded-lg border-2 border-primary-hot/20"
                      style={{
                        backgroundColor: metadata.color || '#f0f0f0',
                      }}
                    ></div>
                  </div>
                </div>

                {/* Material */}
                <div className="animate-slide-up" style={{ animationDelay: '500ms' }}>
                  <label className="block mb-2">
                    <span className="text-lg font-semibold text-text-primary">
                      {getFieldIcon('material')} Material
                    </span>
                    <p className="text-xs text-text-secondary mt-1 font-normal">
                      💡 Tip: Check the garment tag for accuracy
                    </p>
                  </label>
                  <input
                    type="text"
                    value={metadata.material}
                    onChange={(e) => handleMetadataChange('material', e.target.value)}
                    placeholder="e.g., cotton, silk, denim, wool"
                    className="w-full px-4 py-3 border-2 border-primary-hot/20 rounded-lg focus:border-primary-hot focus:ring-2 focus:ring-primary-hot/20 focus:outline-none transition-all bg-white"
                  />
                </div>

                {/* Formality */}
                <div className="animate-slide-up" style={{ animationDelay: '550ms' }}>
                  <label className="block mb-2">
                    <span className="text-lg font-semibold text-text-primary">
                      {getFieldIcon('formality')} Formality
                    </span>
                  </label>
                  <select
                    value={metadata.formality}
                    onChange={(e) => handleMetadataChange('formality', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-primary-hot/20 rounded-lg focus:border-primary-hot focus:ring-2 focus:ring-primary-hot/20 focus:outline-none transition-all bg-white font-medium"
                  >
                    <option value="">Choose one...</option>
                    <option value="casual">Casual 👖</option>
                    <option value="business casual">Business Casual 👔</option>
                    <option value="business">Business 🎩</option>
                    <option value="formal">Formal 🍾</option>
                  </select>
                </div>

                {/* Fit */}
                <div className="animate-slide-up" style={{ animationDelay: '600ms' }}>
                  <label className="block mb-2">
                    <span className="text-lg font-semibold text-text-primary">
                      {getFieldIcon('fit')} Fit
                    </span>
                  </label>
                  <select
                    value={metadata.fit}
                    onChange={(e) => handleMetadataChange('fit', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-primary-hot/20 rounded-lg focus:border-primary-hot focus:ring-2 focus:ring-primary-hot/20 focus:outline-none transition-all bg-white font-medium"
                  >
                    <option value="">Choose one...</option>
                    <option value="fitted">Fitted 💪</option>
                    <option value="regular">Regular 👚</option>
                    <option value="loose">Loose 🎪</option>
                    <option value="oversize">Oversize 🛌</option>
                  </select>
                </div>

                {/* Silhouette */}
                <div className="animate-slide-up" style={{ animationDelay: '650ms' }}>
                  <label className="block mb-2">
                    <span className="text-lg font-semibold text-text-primary">
                      {getFieldIcon('silhouette')} Silhouette
                    </span>
                  </label>
                  <input
                    type="text"
                    value={metadata.silhouette}
                    onChange={(e) => handleMetadataChange('silhouette', e.target.value)}
                    placeholder="e.g., straight, fitted, A-line, flowing"
                    className="w-full px-4 py-3 border-2 border-primary-hot/20 rounded-lg focus:border-primary-hot focus:ring-2 focus:ring-primary-hot/20 focus:outline-none transition-all bg-white"
                  />
                </div>

                {/* Visual Weight */}
                <div className="animate-slide-up" style={{ animationDelay: '700ms' }}>
                  <label className="block mb-2">
                    <span className="text-lg font-semibold text-text-primary">
                      {getFieldIcon('visual_weight')} Visual Weight
                    </span>
                  </label>
                  <select
                    value={metadata.visual_weight}
                    onChange={(e) => handleMetadataChange('visual_weight', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-primary-hot/20 rounded-lg focus:border-primary-hot focus:ring-2 focus:ring-primary-hot/20 focus:outline-none transition-all bg-white font-medium"
                  >
                    <option value="">Choose one...</option>
                    <option value="light">Light 🪶</option>
                    <option value="medium">Medium ⚖️</option>
                    <option value="heavy">Heavy 🏋️</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button
                  onClick={() => {
                    setImagePreview(null)
                    setMetadata(null)
                    setDetectedItems([])
                    setSelectedItem('')
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                  className="px-6 py-3 bg-bg-secondary text-text-primary font-semibold rounded-lg hover:bg-bg-dark/10 transition-all"
                >
                  ← Start Over
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-primary text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin">⟳</span>
                      Saving...
                    </>
                  ) : (
                    <>💾 Save Item</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!metadata && !imagePreview && (
          <div className="text-center py-16 animate-slide-up">
            <p className="text-2xl text-text-secondary font-medium">
              👇 Start by uploading an outfit photo
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
