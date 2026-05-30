'use client'

import { useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/apiFetch'
import { usePaginatedWardrobe } from '@/hooks/usePaginatedWardrobe'
import { getThumbnailUrl, generateSrcSet } from '@/lib/image-optimizer'

interface WardrobeItem {
  id: string
  filename?: string
  description?: string
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

const FILTER_TABS = ['All items', 'Tops', 'Bottoms', 'Outerwear', 'Accessories']

function itemMatchesFilter(item: WardrobeItem, filter: string) {
  if (filter === 'All items') return true
  const type = item.item_type.toLowerCase()
  const map: Record<string, string[]> = {
    Tops: ['shirt', 'blouse', 'top', 'tee', 't-shirt', 'sweater', 'jumper', 'knit'],
    Bottoms: ['pant', 'trouser', 'jean', 'skirt', 'short'],
    Outerwear: ['coat', 'jacket', 'blazer', 'cardigan', 'vest'],
    Accessories: ['bag', 'shoe', 'boot', 'belt', 'scarf', 'hat', 'accessory'],
  }
  return (map[filter] ?? []).some((kw) => type.includes(kw))
}

export default function WardrobeGallery() {
  const { items, page, setPage, total, hasMore, totalPages, loading, error, refresh } = usePaginatedWardrobe(20)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState('All items')

  const handleDelete = async (itemId: string) => {
    if (!confirm('Remove this piece from your wardrobe?')) return
    setDeleting(itemId)
    try {
      const response = await apiFetch(`/api/wardrobe/items?id=${itemId}`, { method: 'DELETE' })
      if (response.ok) {
        refresh()
      } else {
        const data = await response.json()
        console.error('Delete failed:', data.error || 'Failed to delete item')
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleting(null)
    }
  }

  const filtered = items.filter((item) => itemMatchesFilter(item, activeFilter))

  return (
    <div className="bg-surface min-h-screen">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="border-b border-outline-variant">
        <div className="max-w-atelier mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-8 md:py-12 lg:py-16 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-6">
          <div>
            <p className="label-caps mb-2 sm:mb-3 md:mb-4 text-xs sm:text-sm">My Wardrobe</p>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal text-on-surface mb-1 sm:mb-2">
              Your Collection
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant">
              {total} piece{total !== 1 ? 's' : ''} catalogued
            </p>
          </div>
          <Link
            href="/wardrobe"
            className="px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 bg-on-surface text-surface text-xs sm:text-sm font-medium tracking-btn uppercase hover:bg-black transition-colors duration-150 whitespace-nowrap"
          >
            + Add New Piece
          </Link>
        </div>
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="border-b border-outline-variant">
        <div className="max-w-atelier mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
          <div className="flex gap-2 sm:gap-4 md:gap-6 lg:gap-8 overflow-x-auto">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`py-3 sm:py-4 label-caps text-xs sm:text-sm transition-colors duration-150 whitespace-nowrap ${
                  activeFilter === tab
                    ? 'text-on-surface border-b border-on-surface'
                    : 'text-outline hover:text-on-surface-variant'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-atelier mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-6 sm:py-8 md:py-12 lg:py-16">

        {/* Loading */}
        {loading && (
          <div className="py-32 text-center">
            <p className="label-caps text-outline animate-pulse">Loading collection…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 border border-error bg-error-container">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && total === 0 && !error && (
          <div className="py-32 text-center border border-outline-variant">
            <h2 className="font-serif text-headline-sm font-normal text-on-surface mb-4">
              Your wardrobe is empty
            </h2>
            <p className="text-sm text-on-surface-variant mb-8">
              Begin building your digital collection by uploading your first piece.
            </p>
            <Link
              href="/wardrobe"
              className="px-8 py-4 bg-on-surface text-surface text-sm font-medium tracking-btn uppercase hover:bg-black transition-colors duration-150"
            >
              Upload First Piece
            </Link>
          </div>
        )}

        {/* Gallery grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 sm:gap-x-5 md:gap-x-6 lg:gap-x-8 gap-y-8 sm:gap-y-10 md:gap-y-12 lg:gap-y-14">
            {filtered.map((item) => (
              <div key={item.id} className="group transition-transform duration-300 hover:-translate-y-1">
                {/* Image */}
                <div className="w-full aspect-[3/4] bg-surface-container overflow-hidden mb-5 relative">
                  {item.imageUrl ? (
                    <picture>
                      <source
                        srcSet={generateSrcSet(item.imageUrl)}
                        type="image/webp"
                      />
                      <img
                        src={getThumbnailUrl(item.imageUrl)}
                        srcSet={generateSrcSet(item.imageUrl)}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        loading="lazy"
                        alt={item.item_type}
                        className="w-full h-full object-contain"
                      />
                    </picture>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="label-caps text-outline">{item.item_type.charAt(0)}</span>
                    </div>
                  )}
                  {/* Delete on hover */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="absolute top-3 right-3 w-7 h-7 bg-surface border border-outline-variant text-on-surface-variant text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-error hover:text-surface hover:border-error disabled:opacity-40"
                    title="Remove piece"
                  >
                    ×
                  </button>
                </div>

                {/* Details */}
                <div>
                  <p className="label-caps text-outline mb-1.5">{item.formality}</p>
                  <h3 className="font-serif text-base font-normal text-on-surface mb-1">
                    {item.item_type}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-on-surface-variant italic mb-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-3 h-3 border border-outline-variant flex-shrink-0"
                      style={{ backgroundColor: item.color || '#e5e2e1' }}
                    />
                    <p className="text-xs text-on-surface-variant">{item.color}</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="label-caps text-outline">{item.material}</span>
                    <span className="label-caps text-outline">·</span>
                    <span className="label-caps text-outline">{item.fit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results for active filter */}
        {!loading && total > 0 && filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-sm text-on-surface-variant">
              No items in the &ldquo;{activeFilter}&rdquo; category.
            </p>
          </div>
        )}

        {/* Pagination controls */}
        {!loading && total > 0 && filtered.length > 0 && totalPages > 1 && (
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 sm:px-6 py-2.5 border border-outline-variant text-on-surface text-sm font-medium hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            >
              ← Previous
            </button>
            <div className="text-sm text-on-surface-variant">
              Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
            </div>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore}
              className="px-4 sm:px-6 py-2.5 border border-outline-variant text-on-surface text-sm font-medium hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
