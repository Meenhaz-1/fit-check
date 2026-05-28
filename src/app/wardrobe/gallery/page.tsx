'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/apiFetch'

interface WardrobeItem {
  id: string
  filename: string
  item_type: string
  color: string
  material: string
  formality: string
  fit: string
  silhouette: string
  visual_weight: string
  uploaded_at: string
  imageUrl?: string
}

const formalityColors: Record<string, { bg: string; border: string; emoji: string }> = {
  casual: { bg: 'bg-yellow-100', border: 'border-yellow-400', emoji: '👖' },
  'business casual': { bg: 'bg-orange-100', border: 'border-orange-400', emoji: '👔' },
  business: { bg: 'bg-blue-100', border: 'border-blue-400', emoji: '🎩' },
  formal: { bg: 'bg-purple-100', border: 'border-purple-400', emoji: '🍾' },
}

const rotations = ['rotate-1', '-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-1', 'rotate-1', '-rotate-2', 'rotate-1']

export default function WardrobeGallery() {
  const [items, setItems] = useState<WardrobeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch('/api/wardrobe/items', { method: 'GET' })
      const data = await response.json()

      if (response.ok && data.items) {
        setItems(data.items)
      } else {
        setError('Failed to load wardrobe')
      }
    } catch (err) {
      setError('Error loading items')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (itemId: string) => {
    if (!confirm('Delete this item?')) return

    setDeleting(itemId)
    try {
      // TODO: Create DELETE endpoint
      // For now, just remove from state
      setItems(items.filter(item => item.id !== itemId))
    } catch (err) {
      setError('Failed to delete item')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #6C5CE7 0%, #FF6B9D 25%, #FFB84D 50%, #6C5CE7 75%, #FF6B9D 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite'
    }}>
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      {/* Decorative shapes */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 -right-20 w-96 h-96 bg-black/5 transform rotate-45"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 border-4 border-white/10 rounded-full"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="pt-8 px-6 pb-4 border-b-4 border-white/20">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <h1 className="font-display text-6xl font-black text-white drop-shadow-lg" style={{
              textShadow: '4px 4px 0px rgba(0,0,0,0.2)',
            }}>
              YOUR COLLECTION
            </h1>
            <Link
              href="/wardrobe"
              className="px-6 py-3 bg-white text-primary-hot font-display font-black rounded-2xl hover:scale-110 transition-transform border-3 border-white shadow-lg"
            >
              + ADD MORE
            </Link>
          </div>
          <p className="text-white/90 font-bold text-lg max-w-7xl mx-auto ml-6 mt-2">
            {items.length} piece{items.length !== 1 ? 's' : ''} so far
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Loading state */}
          {loading && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 animate-bounce">⟳</div>
              <p className="font-display text-3xl font-black text-white drop-shadow-lg">
                LOADING YOUR STYLE...
              </p>
            </div>
          )}

          {/* Empty state */}
          {!loading && items.length === 0 && (
            <div className="text-center py-20 bg-white/10 backdrop-blur rounded-3xl border-4 border-white/20">
              <p className="font-display text-5xl font-black text-white drop-shadow-lg mb-4">
                NO ITEMS YET
              </p>
              <p className="text-white/90 text-xl font-bold mb-6">
                Time to build your wardrobe!
              </p>
              <Link
                href="/wardrobe"
                className="inline-block px-8 py-4 bg-gradient-to-r from-primary-hot to-primary-joy text-white font-display font-black text-2xl rounded-2xl hover:scale-110 transition-transform border-4 border-white shadow-xl"
              >
                📸 START UPLOADING
              </Link>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-400/90 backdrop-blur rounded-3xl p-6 border-4 border-red-600 mb-8">
              <p className="font-bold text-red-900 text-lg">
                ⚠️ {error}
              </p>
            </div>
          )}

          {/* Gallery Grid - Maximalist chaos */}
          {!loading && items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-max">
              {items.map((item, idx) => {
                const formality = item.formality.toLowerCase() as keyof typeof formalityColors
                const colors = formalityColors[formality] || formalityColors.casual
                const rotation = rotations[idx % rotations.length]

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border-4 overflow-hidden shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 ${rotation} ${colors.border}`}
                    style={{
                      borderColor: item.color || '#FF6B9D',
                    }}
                  >
                    {/* Item image */}
                    {item.imageUrl ? (
                      <div className="w-full aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={item.imageUrl}
                          alt={item.item_type}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className={`w-full aspect-square ${colors.bg} flex items-center justify-center text-6xl`}>
                        👗
                      </div>
                    )}

                    {/* Item details */}
                    <div className="p-4">
                      {/* Item type - Bold headline */}
                      <h3 className="font-display text-2xl font-black text-text-primary mb-3" style={{
                        textTransform: 'uppercase'
                      }}>
                        {item.item_type}
                      </h3>

                      {/* Color swatch and name */}
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow"
                          style={{ backgroundColor: item.color || '#gray' }}
                        ></div>
                        <span className="font-bold text-text-primary">{item.color}</span>
                      </div>

                      {/* Metadata grid */}
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="font-bold text-text-secondary">Material:</span>
                          <span className="text-text-primary">{item.material}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-text-secondary">Formality:</span>
                          <span className="text-text-primary">{item.formality} {colors.emoji}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-text-secondary">Fit:</span>
                          <span className="text-text-primary">{item.fit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-text-secondary">Silhouette:</span>
                          <span className="text-text-primary">{item.silhouette}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t-2 border-gray-200">
                        <button
                          className="px-3 py-2 bg-gray-100 text-text-primary font-bold rounded-lg hover:bg-gray-200 transition text-sm"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                          className="px-3 py-2 bg-red-100 text-red-700 font-bold rounded-lg hover:bg-red-200 transition text-sm disabled:opacity-50"
                        >
                          {deleting === item.id ? '⟳' : '🗑️ Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
