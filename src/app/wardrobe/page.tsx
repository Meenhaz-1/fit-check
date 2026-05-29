'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { ExtractedMetadata } from '@/lib/metadata'
import { apiFetch } from '@/lib/apiFetch'

interface MetadataFormState {
  filename: string
  description?: string
  item_type: string
  color: string
  material: string
  formality: string
  fit: string
  silhouette: string
  visual_weight: string
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="label-caps mb-3">{children}</p>
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 border border-outline-variant bg-white text-on-surface text-sm placeholder:text-outline focus:border-on-surface transition-colors duration-150"
    />
  )
}

function SelectInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 border border-outline-variant bg-white text-on-surface text-sm focus:border-on-surface transition-colors duration-150"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
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
        description: '',
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
          const cleanItems = data.items.map((item: string) => item.replace(/^-\s*/, ''))
          setDetectedItems(cleanItems)
          setSelectedItem(cleanItems[0])
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

      setMetadata({ ...metadata, ...data.metadata })
      setSuccess('Metadata extracted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract metadata')
    } finally {
      setExtracting(false)
    }
  }

  const handleMetadataChange = (
    field: keyof Omit<MetadataFormState, 'filename'>,
    value: string
  ) => {
    if (!metadata) return
    setMetadata({ ...metadata, [field]: value })
  }

  const handleSave = async () => {
    if (!metadata) {
      setError('No metadata to save')
      return
    }

    const requiredFields = [
      'item_type',
      'color',
      'material',
      'formality',
      'fit',
      'silhouette',
      'visual_weight',
    ]
    for (const field of requiredFields) {
      if (!metadata[field as keyof MetadataFormState]) {
        setError(`Missing: ${field.replace('_', ' ')}`)
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
          description: selectedItem,
          image: imagePreview,
          mediaType: mediaType || 'image/jpeg',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save item')
      }

      setSuccess('Item saved to your wardrobe')
      setTimeout(() => {
        setImagePreview(null)
        setMediaType(null)
        setMetadata(null)
        setDetectedItems([])
        setSelectedItem('')
        setSuccess(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setImagePreview(null)
    setMediaType(null)
    setMetadata(null)
    setDetectedItems([])
    setSelectedItem('')
    setError(null)
    setSuccess(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Sync selectedItem to description field when item selection changes
  useEffect(() => {
    if (selectedItem && metadata) {
      setMetadata({ ...metadata, description: selectedItem })
    }
  }, [selectedItem])

  return (
    <div className="bg-surface min-h-screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="border-b border-outline-variant">
        <div className="max-w-atelier mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-8 md:py-12 lg:py-16">
          <p className="label-caps mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm">Digital Scan</p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-on-surface mb-2 sm:mb-3">
            Add a New Piece
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
            Upload a garment photograph. Our AI will extract its complete
            metadata — colour, material, silhouette, fit, and visual weight.
          </p>
        </div>
      </div>

      <div className="max-w-atelier mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-8 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-24">

          {/* ── Left: Image upload ──────────────────────────────────────────── */}
          <div>
            {!imagePreview ? (
              <label className="block cursor-pointer group">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="sr-only"
                />
                <div className="border border-outline-variant bg-surface-low aspect-[3/4] flex flex-col items-center justify-center group-hover:border-on-surface transition-colors duration-150">
                  <div className="w-10 h-10 border border-outline flex items-center justify-center mb-6">
                    <span className="text-lg text-outline">+</span>
                  </div>
                  <p className="label-caps mb-2">Upload Photograph</p>
                  <p className="text-xs text-outline">JPG, PNG up to 10 MB</p>
                </div>
              </label>
            ) : (
              <div>
                <div className="border border-outline-variant bg-surface-container aspect-[3/4] overflow-hidden flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Garment preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  onClick={handleReset}
                  className="mt-4 label-caps text-outline hover:text-on-surface transition-colors duration-150"
                >
                  ← Replace Image
                </button>
              </div>
            )}

            {/* Detected items */}
            {detectedItems.length > 0 && (
              <div className="mt-8 border-t border-outline-variant pt-8">
                <p className="label-caps mb-4">AI Detected</p>
                <div className="space-y-2">
                  {detectedItems.map((item) => (
                    <label
                      key={item}
                      className="flex items-center gap-3 cursor-pointer py-2 group"
                    >
                      <input
                        type="radio"
                        name="detected-item"
                        value={item}
                        checked={selectedItem === item}
                        onChange={(e) => setSelectedItem(e.target.value)}
                        className="w-3.5 h-3.5 accent-on-surface"
                      />
                      <span className="text-sm text-on-surface group-hover:text-on-surface-variant transition-colors">
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Metadata form ────────────────────────────────────────── */}
          <div>
            {/* Status messages */}
            {error && (
              <div className="mb-8 p-4 border border-error bg-error-container">
                <p className="text-sm text-error">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-8 p-4 border border-success bg-surface-low">
                <p className="text-sm text-success">{success}</p>
              </div>
            )}

            {metadata ? (
              <div className="space-y-8">
                <div className="flex justify-between items-center border-b border-outline-variant pb-6">
                  <h2 className="font-serif text-xl font-normal text-on-surface">
                    Garment Details
                  </h2>
                  <button
                    onClick={handleExtractMetadata}
                    disabled={extracting}
                    className="px-6 py-2.5 bg-on-surface text-surface text-sm font-medium tracking-btn uppercase hover:bg-black transition-colors duration-150 disabled:opacity-40"
                  >
                    {extracting ? 'Analysing…' : 'Auto-fill with AI'}
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <TextInput
                      value={metadata.description || ''}
                      onChange={(v) => handleMetadataChange('description', v)}
                      placeholder="e.g. Pale yellow linen shirt, slightly oversized fit"
                    />
                  </div>

                  <div>
                    <FieldLabel>Item Type</FieldLabel>
                    <TextInput
                      value={metadata.item_type}
                      onChange={(v) => handleMetadataChange('item_type', v)}
                      placeholder="e.g. Blazer, Silk blouse, Slim trousers"
                    />
                  </div>

                  <div>
                    <FieldLabel>Colour</FieldLabel>
                    <div className="flex gap-3">
                      <TextInput
                        value={metadata.color}
                        onChange={(v) => handleMetadataChange('color', v)}
                        placeholder="e.g. Navy, Ivory, Burgundy"
                      />
                      <div
                        className="w-14 border border-outline-variant flex-shrink-0"
                        style={{ backgroundColor: metadata.color || '#e5e2e1' }}
                      />
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Material</FieldLabel>
                    <TextInput
                      value={metadata.material}
                      onChange={(v) => handleMetadataChange('material', v)}
                      placeholder="e.g. Merino wool, Silk, Cotton twill"
                    />
                  </div>

                  <div>
                    <FieldLabel>Formality Level</FieldLabel>
                    <SelectInput
                      value={metadata.formality}
                      onChange={(v) => handleMetadataChange('formality', v)}
                      placeholder="Select formality"
                      options={[
                        { value: 'casual', label: 'Casual' },
                        { value: 'business casual', label: 'Business Casual' },
                        { value: 'business', label: 'Business' },
                        { value: 'formal', label: 'Formal' },
                      ]}
                    />
                  </div>

                  <div>
                    <FieldLabel>Fit</FieldLabel>
                    <SelectInput
                      value={metadata.fit}
                      onChange={(v) => handleMetadataChange('fit', v)}
                      placeholder="Select fit"
                      options={[
                        { value: 'fitted', label: 'Fitted' },
                        { value: 'regular', label: 'Regular' },
                        { value: 'loose', label: 'Loose' },
                        { value: 'oversize', label: 'Oversize' },
                      ]}
                    />
                  </div>

                  <div>
                    <FieldLabel>Silhouette</FieldLabel>
                    <TextInput
                      value={metadata.silhouette}
                      onChange={(v) => handleMetadataChange('silhouette', v)}
                      placeholder="e.g. Straight, A-line, Tapered"
                    />
                  </div>

                  <div>
                    <FieldLabel>Visual Weight</FieldLabel>
                    <SelectInput
                      value={metadata.visual_weight}
                      onChange={(v) => handleMetadataChange('visual_weight', v)}
                      placeholder="Select visual weight"
                      options={[
                        { value: 'light', label: 'Light' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'heavy', label: 'Heavy' },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-outline-variant">
                  <button
                    onClick={handleReset}
                    className="px-6 py-3 border border-outline text-on-surface-variant text-sm font-medium tracking-btn uppercase hover:border-on-surface hover:text-on-surface transition-colors duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-on-surface text-surface text-sm font-medium tracking-btn uppercase hover:bg-black transition-colors duration-150 disabled:opacity-40"
                  >
                    {loading ? 'Saving…' : 'Save to Wardrobe'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-outline-variant pt-8">
                <p className="text-sm text-on-surface-variant">
                  Upload a photograph to begin extraction.
                </p>
                <p className="text-sm text-on-surface-variant mt-2">
                  Already have pieces saved?{' '}
                  <Link
                    href="/wardrobe/gallery"
                    className="text-on-surface border-b border-on-surface pb-px"
                  >
                    View My Wardrobe
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
