'use client'

import { useState, useRef } from 'react'
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setSuccess(null)
    setDetectedItems([])
    setSelectedItem('')

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      setImagePreview(base64)

      // Initialize metadata form with filename
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

      // Detect items in the image
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

    setLoading(true)
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
      setSuccess('Metadata extracted successfully. Review and edit before saving.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract metadata')
    } finally {
      setLoading(false)
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

    // Validate all fields are filled
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

      setSuccess('Item saved to wardrobe successfully!')
      setImagePreview(null)
      setMetadata(null)
      setDetectedItems([])
      setSelectedItem('')

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-4xl font-bold mb-8">Upload Wardrobe Item</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        <div className="mb-8 p-6 border-2 border-dashed border-gray-300 rounded-lg">
          <label className="block mb-4">
            <span className="block text-lg font-semibold mb-2">Select Image</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </label>
        </div>

        {imagePreview && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Preview</h2>
            <img src={imagePreview} alt="Preview" className="max-w-full h-auto rounded-lg" />
          </div>
        )}

        {detectedItems.length > 0 && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">Detected Items</h2>
            <p className="text-sm text-gray-600 mb-3">Select the item you want to evaluate:</p>
            <div className="space-y-2">
              {detectedItems.map((item, idx) => (
                <label key={idx} className="flex items-center">
                  <input
                    type="radio"
                    name="detected-item"
                    value={item}
                    checked={selectedItem === item}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="mr-3"
                  />
                  <span className="text-gray-800">{item}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {metadata && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Metadata</h2>
              <button
                onClick={handleExtractMetadata}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Extracting...' : 'Auto-Extract'}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filename</label>
                <input
                  type="text"
                  value={metadata.filename}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
                <input
                  type="text"
                  value={metadata.item_type}
                  onChange={(e) => handleMetadataChange('item_type', e.target.value)}
                  placeholder="e.g., button-up shirt, pants, jacket"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <input
                  type="text"
                  value={metadata.color}
                  onChange={(e) => handleMetadataChange('color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Material
                  <span className="text-xs text-gray-500 block font-normal mt-1">
                    💡 Tip: Check the garment tag if unsure (AI extraction may be inaccurate for similar fabrics like cotton vs linen)
                  </span>
                </label>
                <input
                  type="text"
                  value={metadata.material}
                  onChange={(e) => handleMetadataChange('material', e.target.value)}
                  placeholder="e.g., cotton, polyester, linen, wool"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formality</label>
                <select
                  value={metadata.formality}
                  onChange={(e) => handleMetadataChange('formality', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="casual">Casual</option>
                  <option value="business casual">Business Casual</option>
                  <option value="business">Business</option>
                  <option value="formal">Formal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fit</label>
                <select
                  value={metadata.fit}
                  onChange={(e) => handleMetadataChange('fit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="fitted">Fitted</option>
                  <option value="regular">Regular</option>
                  <option value="loose">Loose</option>
                  <option value="oversize">Oversize</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Silhouette</label>
                <input
                  type="text"
                  value={metadata.silhouette}
                  onChange={(e) => handleMetadataChange('silhouette', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visual Weight</label>
                <select
                  value={metadata.visual_weight}
                  onChange={(e) => handleMetadataChange('visual_weight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={loading}
              className="mt-6 w-full px-4 py-3 bg-green-500 text-white font-semibold rounded-md hover:bg-green-600 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        )}

        {!metadata && !imagePreview && (
          <div className="text-center text-gray-500 py-8">
            Select an image to get started
          </div>
        )}
      </div>
  )
}
