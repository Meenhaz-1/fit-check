'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/apiFetch'
import type { OutfitSuggestion } from '@/types'

interface WardrobeItem {
  id: string
  item_type: string
  color: string
  material: string
  visual_weight: string
  formality: string
  imageUrl?: string
}

export default function OutfitBuilder() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'upload' | 'select'>('upload')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [outfitSuggestions, setOutfitSuggestions] = useState<OutfitSuggestion[]>([])
  const [detectedPiece, setDetectedPiece] = useState<{ type: string; metadata: Record<string, string> } | null>(null)

  // Fetch wardrobe items for the select tab
  useEffect(() => {
    const fetchWardrobeItems = async () => {
      try {
        const response = await apiFetch('/api/wardrobe/items', { method: 'GET' })
        const data = await response.json()
        if (response.ok && data.items) {
          setWardrobeItems(data.items)
        }
      } catch (err) {
        console.error('Failed to fetch wardrobe items:', err)
      }
    }
    fetchWardrobeItems()
  }, [])

  // Auto-scroll to suggestions when they're ready
  useEffect(() => {
    if (outfitSuggestions.length > 0 && suggestionsRef.current) {
      // Small delay to ensure DOM has rendered
      setTimeout(() => {
        suggestionsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }, 300)
    }
  }, [outfitSuggestions])

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setOutfitSuggestions([])
    setDetectedPiece(null)

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      setImagePreview(base64)

      // Call the outfit builder upload endpoint
      setLoading(true)
      try {
        const response = await apiFetch('/api/wardrobe/outfit-builder/upload', {
          method: 'POST',
          body: JSON.stringify({
            image: base64,
            mediaType: file.type || 'image/jpeg',
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to generate outfit suggestions')
        } else {
          setDetectedPiece(data.detectedPiece)
          setOutfitSuggestions(data.outfitSuggestions || [])
          if (data.message) {
            setError(data.message) // Show info message if wardrobe is empty
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate outfits')
      } finally {
        setLoading(false)
      }
    }

    reader.readAsDataURL(file)
  }

  const handleSelectItem = async (itemId: string) => {
    setSelectedItemId(itemId)
    setError(null)
    setOutfitSuggestions([])
    setDetectedPiece(null)
    setImagePreview(null)

    const selectedItem = wardrobeItems.find((item) => item.id === itemId)
    if (!selectedItem) return

    // Determine item type
    let itemType: 'top' | 'bottom' | 'shoes' = 'top'
    const itemLower = selectedItem.item_type.toLowerCase()
    if (
      itemLower.includes('pant') ||
      itemLower.includes('trouser') ||
      itemLower.includes('jean') ||
      itemLower.includes('skirt') ||
      itemLower.includes('short')
    ) {
      itemType = 'bottom'
    } else if (
      itemLower.includes('shoe') ||
      itemLower.includes('boot') ||
      itemLower.includes('sneaker') ||
      itemLower.includes('loafer') ||
      itemLower.includes('sandal')
    ) {
      itemType = 'shoes'
    }

    // Call the outfit builder select endpoint
    setLoading(true)
    try {
      const response = await apiFetch('/api/wardrobe/outfit-builder/select', {
        method: 'POST',
        body: JSON.stringify({
          itemId,
          itemType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate outfit suggestions')
      } else {
        setDetectedPiece(data.detectedPiece)
        setOutfitSuggestions(data.outfitSuggestions || [])
        if (data.message) {
          setError(data.message)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate outfits')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setImagePreview(null)
    setSelectedItemId(null)
    setError(null)
    setOutfitSuggestions([])
    setDetectedPiece(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="bg-surface min-h-screen">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="border-b border-outline-variant">
        <div className="max-w-atelier mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-8 md:py-12 lg:py-16">
          <p className="label-caps mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm">Outfit Builder</p>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-on-surface mb-2 sm:mb-3">
            Build Complete Outfits
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
            Upload a new piece or select from your wardrobe. Get 3 complete outfit suggestions
            with styling explanations and occasions.
          </p>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <div className="border-b border-outline-variant">
        <div className="max-w-atelier mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
          <div className="flex gap-4 sm:gap-6 md:gap-8 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('upload')
                handleReset()
              }}
              className={`py-3 sm:py-4 label-caps transition-colors duration-150 text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'upload'
                  ? 'text-on-surface border-b border-on-surface'
                  : 'text-outline hover:text-on-surface-variant'
              }`}
            >
              Upload New Piece
            </button>
            <button
              onClick={() => {
                setActiveTab('select')
                handleReset()
              }}
              className={`py-3 sm:py-4 label-caps transition-colors duration-150 text-xs sm:text-sm whitespace-nowrap ${
                activeTab === 'select'
                  ? 'text-on-surface border-b border-on-surface'
                  : 'text-outline hover:text-on-surface-variant'
              }`}
            >
              Select from Wardrobe
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-atelier mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-8 md:py-12 lg:py-16">
        {/* ── UPLOAD TAB ────────────────────────────────────────────────── */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-24">
            {/* Left: Image upload */}
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
                      alt="Uploaded piece preview"
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
            </div>

            {/* Right: Results */}
            <div>
              {error && (
                <div className="mb-8 p-4 border border-error bg-error-container">
                  <p className="text-sm text-error">{error}</p>
                </div>
              )}

              {loading && (
                <div className="mb-8 pb-8 border-b border-outline-variant">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-sage rounded-full animate-loading-pulse"></div>
                    <p className="label-caps text-on-surface-variant animate-loading-pulse">Generating outfit suggestions…</p>
                  </div>
                </div>
              )}

              {outfitSuggestions.length > 0 && (
                <div ref={suggestionsRef} className="space-y-6">
                  <div>
                    <h2 className="font-serif text-xl font-normal text-on-surface mb-2">
                      Suggested Outfits
                    </h2>
                    {detectedPiece && (
                      <p className="text-sm text-on-surface-variant">
                        Based on: {detectedPiece.type}
                      </p>
                    )}
                  </div>

                  {outfitSuggestions.map((outfit, idx) => (
                    <OutfitCard key={idx} outfit={outfit} />
                  ))}

                  <button
                    onClick={handleReset}
                    className="w-full px-6 py-3 border border-outline text-on-surface-variant text-sm font-medium tracking-btn uppercase hover:border-on-surface hover:text-on-surface transition-colors duration-150"
                  >
                    Start Over
                  </button>
                </div>
              )}

              {!loading && outfitSuggestions.length === 0 && !imagePreview && (
                <div className="border-t border-outline-variant pt-8">
                  <p className="text-sm text-on-surface-variant">
                    Upload a photo to get outfit suggestions.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SELECT TAB ────────────────────────────────────────────────– */}
        {activeTab === 'select' && (
          <div>
            {wardrobeItems.length === 0 ? (
              <div className="text-center py-16 border border-outline-variant">
                <h2 className="font-serif text-headline-sm font-normal text-on-surface mb-4">
                  Your wardrobe is empty
                </h2>
                <p className="text-sm text-on-surface-variant mb-8">
                  Add items to your wardrobe first to use the outfit builder.
                </p>
                <Link
                  href="/wardrobe"
                  className="px-8 py-4 bg-on-surface text-surface text-sm font-medium tracking-btn uppercase hover:bg-black transition-colors duration-150"
                >
                  + Add Items
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-24">
                {/* Left: Gallery preview */}
                <div>
                  <p className="label-caps mb-4 sm:mb-6 text-xs sm:text-sm">Click an item to build outfits around it:</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                    {wardrobeItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleSelectItem(item.id)}
                        disabled={loading}
                        className={`group relative overflow-hidden border-2 transition-all duration-150 ${
                          selectedItemId === item.id
                            ? 'border-on-surface bg-surface-container'
                            : 'border-outline-variant hover:border-on-surface'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="aspect-[3/4] bg-surface-low flex items-center justify-center overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.item_type}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="label-caps text-outline">{item.item_type.charAt(0)}</span>
                          )}
                        </div>
                        <div className="p-3 bg-surface-container">
                          <p className="text-xs font-medium text-on-surface truncate">{item.item_type}</p>
                          <p className="text-xs text-on-surface-variant">{item.color}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: Results */}
                <div>
                  {error && (
                    <div className="mb-8 p-4 border border-error bg-error-container">
                      <p className="text-sm text-error">{error}</p>
                    </div>
                  )}

                  {loading && (
                    <div className="mb-8 pb-8 border-b border-outline-variant">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-sage rounded-full animate-loading-pulse"></div>
                        <p className="label-caps text-on-surface-variant animate-loading-pulse">Generating outfit suggestions…</p>
                      </div>
                    </div>
                  )}

                  {outfitSuggestions.length > 0 && (
                    <div ref={suggestionsRef} className="space-y-6">
                      <div>
                        <h2 className="font-serif text-xl font-normal text-on-surface mb-2">
                          Suggested Outfits
                        </h2>
                        {detectedPiece && (
                          <p className="text-sm text-on-surface-variant">
                            Based on: {detectedPiece.type}
                          </p>
                        )}
                      </div>

                      {outfitSuggestions.map((outfit, idx) => (
                        <OutfitCard key={idx} outfit={outfit} />
                      ))}

                      <button
                        onClick={handleReset}
                        className="w-full px-6 py-3 border border-outline text-on-surface-variant text-sm font-medium tracking-btn uppercase hover:border-on-surface hover:text-on-surface transition-colors duration-150"
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}

                  {!loading && outfitSuggestions.length === 0 && !selectedItemId && (
                    <div className="border-t border-outline-variant pt-8">
                      <p className="text-sm text-on-surface-variant">
                        Select a wardrobe item on the left to generate outfit combinations.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Outfit Card Component
function OutfitCard({ outfit }: { outfit: OutfitSuggestion }) {
  return (
    <div className="p-4 sm:p-5 md:p-6 border border-outline-variant bg-surface-container rounded-lg space-y-4">
      {/* Match Score */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
        <h3 className="font-serif text-base sm:text-lg font-normal text-on-surface">Outfit {outfit.id}</h3>
        <span className="text-xs sm:text-sm font-bold text-on-surface">{outfit.matchScore}% match</span>
      </div>

      {/* Outfit Items Preview */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {outfit.top && (
          <div className="min-w-0">
            <div className="aspect-[2/3] bg-surface-low border border-outline-variant flex items-center justify-center mb-1 sm:mb-2 overflow-hidden">
              {outfit.top.imageUrl ? (
                <img
                  src={outfit.top.imageUrl}
                  alt={outfit.top.item_type}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-outline text-center px-1 sm:px-2 text-center line-clamp-2">{outfit.top.item_type}</span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant text-center truncate">{outfit.top.item_type}</p>
            <p className="text-xs text-outline text-center truncate">{outfit.top.color}</p>
          </div>
        )}

        {outfit.bottom && (
          <div className="min-w-0">
            <div className="aspect-[2/3] bg-surface-low border border-outline-variant flex items-center justify-center mb-1 sm:mb-2 overflow-hidden">
              {outfit.bottom.imageUrl ? (
                <img
                  src={outfit.bottom.imageUrl}
                  alt={outfit.bottom.item_type}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-outline text-center px-1 sm:px-2 text-center line-clamp-2">{outfit.bottom.item_type}</span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant text-center truncate">{outfit.bottom.item_type}</p>
            <p className="text-xs text-outline text-center truncate">{outfit.bottom.color}</p>
          </div>
        )}

        {outfit.shoes && (
          <div className="min-w-0">
            <div className="aspect-[2/3] bg-surface-low border border-outline-variant flex items-center justify-center mb-1 sm:mb-2 overflow-hidden">
              {outfit.shoes.imageUrl ? (
                <img
                  src={outfit.shoes.imageUrl}
                  alt={outfit.shoes.item_type}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-outline text-center px-1 sm:px-2 text-center line-clamp-2">{outfit.shoes.item_type}</span>
              )}
            </div>
            <p className="text-xs text-on-surface-variant text-center truncate">{outfit.shoes.item_type}</p>
            <p className="text-xs text-outline text-center truncate">{outfit.shoes.color}</p>
          </div>
        )}
      </div>

      {/* Why It Works */}
      <div className="pt-3 sm:pt-4 border-t border-outline-variant">
        <p className="text-xs font-semibold text-on-surface mb-2 sm:mb-3">Why it works:</p>
        <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
          {outfit.whyItWorks.split('. ').map((sentence, idx) => (
            <p key={idx} className="first:mt-0">
              {sentence.trim()}{!sentence.endsWith('.') && '.'}
            </p>
          ))}
        </div>
      </div>

      {/* Occasions */}
      {outfit.occasions && outfit.occasions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-on-surface mb-2">Perfect for:</p>
          <div className="flex flex-wrap gap-2">
            {outfit.occasions.map((occasion, idx) => (
              <span
                key={idx}
                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-atelier-gold text-on-surface text-xs font-medium label-caps hover:bg-atelier-gold-dim transition-colors duration-150"
              >
                {occasion}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Items */}
      {outfit.missingItems && outfit.missingItems.length > 0 && (
        <div className="pt-2">
          <p className="text-xs text-error">⚠ Missing: {outfit.missingItems.join(', ')}</p>
        </div>
      )}
    </div>
  )
}
