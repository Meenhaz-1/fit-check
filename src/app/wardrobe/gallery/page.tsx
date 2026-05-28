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

const formalityColors: Record<string, string> = {
  casual: 'bg-blue-50',
  'business casual': 'bg-purple-50',
  business: 'bg-slate-50',
  formal: 'bg-gray-50',
}

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
      setItems(items.filter(item => item.id !== itemId))
    } catch (err) {
      setError('Failed to delete item')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Header */}
      <div className="border-b border-divider">
        <div className="max-w-6xl mx-auto px-6 py-16 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Your Wardrobe</h1>
            <p className="text-text-secondary">{items.length} item{items.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/wardrobe"
            className="px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark transition-colors duration-150"
          >
            Add Item
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block">
              <div className="text-4xl mb-4">⟳</div>
              <p className="text-text-secondary">Loading your wardrobe...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-error-bg border border-error rounded-lg">
            <p className="text-sm font-medium text-error">⚠ {error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && !error && (
          <div className="text-center py-20 border border-divider rounded-lg bg-surface-elevated">
            <p className="text-lg font-semibold text-primary mb-4">No items yet</p>
            <p className="text-text-secondary mb-8">Start building your wardrobe by uploading your first item</p>
            <Link
              href="/wardrobe"
              className="inline-block px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent-dark transition-colors duration-150"
            >
              Add Your First Item
            </Link>
          </div>
        )}

        {/* Gallery Grid */}
        {!loading && items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => {
              const formality = item.formality.toLowerCase() as keyof typeof formalityColors
              const bgColor = formalityColors[formality] || formalityColors.casual

              return (
                <div
                  key={item.id}
                  className="bg-surface-elevated border border-divider rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-200"
                >
                  {/* Image */}
                  {item.imageUrl ? (
                    <div className="w-full aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
                      <img
                        src={item.imageUrl}
                        alt={item.item_type}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className={`w-full aspect-square ${bgColor} flex items-center justify-center text-5xl`}>
                      👔
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-6">
                    {/* Item Type */}
                    <h3 className="text-lg font-semibold text-primary mb-4">
                      {item.item_type}
                    </h3>

                    {/* Color Swatch */}
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className="w-8 h-8 rounded border border-divider shadow-sm"
                        style={{ backgroundColor: item.color || '#f0f0f0' }}
                        title={item.color}
                      />
                      <span className="text-sm text-text-primary font-medium">{item.color}</span>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-3 mb-6 pb-6 border-b border-divider">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary font-medium">Material</span>
                        <span className="text-text-primary">{item.material}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary font-medium">Formality</span>
                        <span className="text-text-primary capitalize">{item.formality}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary font-medium">Fit</span>
                        <span className="text-text-primary capitalize">{item.fit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-secondary font-medium">Silhouette</span>
                        <span className="text-text-primary capitalize">{item.silhouette}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        className="flex-1 px-3 py-2 border border-border text-primary font-medium rounded hover:bg-surface-hover transition-colors text-sm"
                        title="Edit coming soon"
                        disabled
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting === item.id}
                        className="flex-1 px-3 py-2 bg-error-bg border border-error text-error font-medium rounded hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
                      >
                        {deleting === item.id ? 'Deleting...' : 'Delete'}
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
  )
}
