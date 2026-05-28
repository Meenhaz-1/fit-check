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
      setSuccess('✨ AI analyzed your outfit!')
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
        body: JSON.stringify(metadata),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save item')
      }

      setSuccess('🎉 Boom! Item saved!')
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

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #FF6B9D 0%, #FFB84D 25%, #6C5CE7 50%, #FF6B9D 75%, #FFB84D 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite'
    }}>
      {/* Animated gradient background */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Bold geometric shapes overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Large circle top right */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>

        {/* Rotated square bottom left */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-black/5 transform rotate-45"></div>

        {/* Diagonal stripe */}
        <div className="absolute top-1/3 -left-20 w-screen h-32 bg-white/5 transform -rotate-12 blur-xl"></div>

        {/* Circle middle */}
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 border-4 border-white/20 rounded-full"></div>

        {/* Triangle shape (using clip-path) */}
        <div className="absolute top-1/2 right-10 w-40 h-40 bg-white/5 transform rotate-45"></div>
      </div>

      <div className="relative z-10">
        {/* Tilted header */}
        <div className="pt-8 px-6" style={{ transform: 'skewY(-2deg)' }}>
          <h1 className="font-display text-7xl font-black text-white mb-2 drop-shadow-lg" style={{
            textShadow: '4px 4px 0px rgba(0,0,0,0.2)',
            letterSpacing: '-0.02em'
          }}>
            FIT IT IN
          </h1>
          <p className="text-white/90 text-xl font-bold ml-2 drop-shadow">
            your wardrobe awaits →
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Main content grid - asymmetrical */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Left column - wider, upload area */}
            <div className="col-span-2">
              {/* Upload Area - Bold and asymmetrical */}
              {!imagePreview ? (
                <label className="block">
                  <div className="relative h-96 bg-white rounded-3xl border-4 border-white/50 overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300 transform hover:-rotate-1">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, #000, #000 10px, transparent 10px, transparent 20px)',
                      }}></div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="sr-only"
                    />

                    <div className="relative h-full flex flex-col items-center justify-center">
                      <div className="text-8xl mb-4 group-hover:scale-125 transition-transform duration-300 drop-shadow-lg">
                        📸
                      </div>
                      <p className="font-display text-4xl font-black text-text-primary text-center px-4" style={{
                        textShadow: '2px 2px 0px rgba(0,0,0,0.1)'
                      }}>
                        DROP YOUR LOOK
                      </p>
                      <p className="text-text-secondary font-bold mt-2">
                        (we'll get the deets)
                      </p>
                    </div>
                  </div>
                </label>
              ) : (
                <div className="relative rounded-3xl overflow-hidden border-4 border-white/50 shadow-2xl transform hover:scale-102 transition-transform group">
                  <div className="relative overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-auto group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  {/* Decorative corner elements */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-3 border-white"></div>
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-3 border-white"></div>
                </div>
              )}
            </div>

            {/* Right column - Detected items & quick actions */}
            <div className="col-span-1 flex flex-col gap-4">
              {detectedItems.length > 0 && (
                <div className="bg-white/95 backdrop-blur rounded-2xl p-4 border-3 border-yellow-300 transform -rotate-2 shadow-xl">
                  <p className="font-display text-2xl font-black text-text-primary mb-3">
                    I SEE 👀
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detectedItems.map((item, idx) => (
                      <label key={idx} className="flex items-start gap-2 p-2 hover:bg-yellow-50 rounded cursor-pointer transition">
                        <input
                          type="radio"
                          name="detected-item"
                          value={item}
                          checked={selectedItem === item}
                          onChange={(e) => setSelectedItem(e.target.value)}
                          className="mt-1.5 w-4 h-4 accent-primary-hot"
                        />
                        <span className="font-bold text-sm text-text-primary">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-300/90 backdrop-blur rounded-2xl p-4 border-3 border-red-600 transform rotate-1 shadow-xl">
                  <p className="font-bold text-red-900 text-sm">
                    ⚠️ {error}
                  </p>
                </div>
              )}

              {success && (
                <div className="bg-green-300/90 backdrop-blur rounded-2xl p-4 border-3 border-green-600 transform -rotate-1 shadow-xl animate-bounce">
                  <p className="font-bold text-green-900">
                    {success}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Form - Maximalist chaos */}
          {metadata && (
            <div className="mt-8">
              <div className="bg-white rounded-3xl border-4 border-primary-hot overflow-hidden shadow-2xl transform hover:shadow-2xl transition-all">
                {/* Form header with bold styling */}
                <div className="bg-gradient-to-r from-primary-hot via-primary-warm to-primary-joy p-6 border-b-4 border-white">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-4xl font-black text-white drop-shadow-lg" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.2)' }}>
                      ✨ DETAILS ✨
                    </h2>
                    <button
                      onClick={handleExtractMetadata}
                      disabled={extracting}
                      className="px-6 py-3 bg-white text-primary-hot font-black rounded-2xl hover:scale-110 transition-transform shadow-lg border-3 border-white"
                    >
                      {extracting ? '⟳ ANALYZING' : '🤖 LET AI GUESS'}
                    </button>
                  </div>
                </div>

                {/* Form fields in bold, asymmetrical layout */}
                <div className="p-8">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Item Type - Full width, bold */}
                    <div className="col-span-2 transform -rotate-1">
                      <label className="block mb-3">
                        <span className="font-display text-3xl font-black text-primary-hot">👔 WHAT IS IT?</span>
                      </label>
                      <input
                        type="text"
                        value={metadata.item_type}
                        onChange={(e) => handleMetadataChange('item_type', e.target.value)}
                        placeholder="be specific!"
                        className="w-full px-4 py-4 border-4 border-primary-hot rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-hot/50 text-lg font-bold bg-yellow-50"
                      />
                    </div>

                    {/* Color */}
                    <div className="transform rotate-1">
                      <label className="block mb-3">
                        <span className="font-display text-2xl font-black text-primary-warm">🎨 COLOR</span>
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={metadata.color}
                          onChange={(e) => handleMetadataChange('color', e.target.value)}
                          placeholder="go wild"
                          className="flex-1 px-4 py-3 border-4 border-primary-warm rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-warm/50 font-bold"
                        />
                        <div className="w-16 h-16 rounded-xl border-4 border-primary-warm shadow-lg" style={{ backgroundColor: metadata.color || '#f0f0f0' }}></div>
                      </div>
                    </div>

                    {/* Material */}
                    <div className="transform -rotate-1">
                      <label className="block mb-3">
                        <span className="font-display text-2xl font-black text-primary-joy">🧵 FABRIC</span>
                      </label>
                      <input
                        type="text"
                        value={metadata.material}
                        onChange={(e) => handleMetadataChange('material', e.target.value)}
                        placeholder="feel it"
                        className="w-full px-4 py-3 border-4 border-primary-joy rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-joy/50 font-bold"
                      />
                    </div>

                    {/* Formality */}
                    <div className="transform rotate-1">
                      <label className="block mb-3">
                        <span className="font-display text-2xl font-black text-primary-hot">⚡ VIBE</span>
                      </label>
                      <select
                        value={metadata.formality}
                        onChange={(e) => handleMetadataChange('formality', e.target.value)}
                        className="w-full px-4 py-3 border-4 border-primary-hot rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-hot/50 font-bold bg-yellow-50"
                      >
                        <option value="">pick one</option>
                        <option value="casual">chill 👖</option>
                        <option value="business casual">kinda formal 👔</option>
                        <option value="business">totally formal 🎩</option>
                        <option value="formal">fancy 🍾</option>
                      </select>
                    </div>

                    {/* Fit */}
                    <div className="transform -rotate-1">
                      <label className="block mb-3">
                        <span className="font-display text-2xl font-black text-primary-warm">👗 FIT</span>
                      </label>
                      <select
                        value={metadata.fit}
                        onChange={(e) => handleMetadataChange('fit', e.target.value)}
                        className="w-full px-4 py-3 border-4 border-primary-warm rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-warm/50 font-bold"
                      >
                        <option value="">choose</option>
                        <option value="fitted">snug 💪</option>
                        <option value="regular">just right 👚</option>
                        <option value="loose">roomy 🎪</option>
                        <option value="oversize">oversized 🛌</option>
                      </select>
                    </div>

                    {/* Silhouette */}
                    <div className="transform rotate-1">
                      <label className="block mb-3">
                        <span className="font-display text-2xl font-black text-primary-joy">🎯 SHAPE</span>
                      </label>
                      <input
                        type="text"
                        value={metadata.silhouette}
                        onChange={(e) => handleMetadataChange('silhouette', e.target.value)}
                        placeholder="straight? A-line?"
                        className="w-full px-4 py-3 border-4 border-primary-joy rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-joy/50 font-bold"
                      />
                    </div>

                    {/* Visual Weight */}
                    <div className="transform -rotate-1">
                      <label className="block mb-3">
                        <span className="font-display text-2xl font-black text-primary-hot">⚖️ WEIGHT</span>
                      </label>
                      <select
                        value={metadata.visual_weight}
                        onChange={(e) => handleMetadataChange('visual_weight', e.target.value)}
                        className="w-full px-4 py-3 border-4 border-primary-hot rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-hot/50 font-bold bg-yellow-50"
                      >
                        <option value="">pick</option>
                        <option value="light">floaty 🪶</option>
                        <option value="medium">balanced ⚖️</option>
                        <option value="heavy">substantial 🏋️</option>
                      </select>
                    </div>
                  </div>

                  {/* Action buttons - Bold and playful */}
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <button
                      onClick={() => {
                        setImagePreview(null)
                        setMetadata(null)
                        setDetectedItems([])
                        setSelectedItem('')
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="px-6 py-4 bg-gray-200 text-text-primary font-display text-2xl font-black rounded-2xl hover:scale-110 transition-transform border-4 border-gray-400 transform rotate-1"
                    >
                      ← RESTART
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-6 py-4 bg-gradient-to-r from-primary-hot to-primary-joy text-white font-display text-2xl font-black rounded-2xl hover:scale-110 transition-transform border-4 border-white shadow-xl transform -rotate-1 disabled:opacity-50"
                    >
                      {loading ? '⟳ SAVING' : '🎉 DONE!'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!metadata && !imagePreview && (
            <div className="text-center py-16">
              <p className="font-display text-5xl font-black text-white drop-shadow-lg" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.2)' }}>
                👆 START HERE
              </p>
              <p className="text-white/80 text-xl font-bold mt-2">
                upload a pic of something you own
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
