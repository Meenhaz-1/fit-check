import { useState, useCallback, useEffect, useRef } from 'react'
import { apiFetch } from '@/lib/apiFetch'

interface CompactWardrobeItem {
  id: string
  t: string
  c: string
  m: string
  f: string
  fi: string
  s: string
  v: string
  u: string
  img?: string
  desc?: string
}

interface WardrobeItem {
  id: string
  item_type: string
  color: string
  material: string
  formality: string
  fit: string
  silhouette: string
  visual_weight: string
  uploaded_at: string
  imageUrl?: string
  description?: string
}

interface PaginatedResponse {
  success: boolean
  page: number
  limit: number
  total: number
  hasMore: boolean
  totalPages: number
  items: CompactWardrobeItem[]
  timestamp: string
}

interface UsePaginatedWardrobeReturn {
  items: WardrobeItem[]
  page: number
  limit: number
  total: number
  hasMore: boolean
  totalPages: number
  loading: boolean
  error: string | null
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  refresh: () => Promise<void>
}

/**
 * PRODUCTION-OPTIMIZED HOOK
 *
 * Benefits:
 * - Only loads 20 items per page (not all 10K)
 * - Prevents unnecessary re-renders with memoized callbacks
 * - Handles page navigation efficiently
 * - Decompresses items only when needed
 * - Caches response for 60s on server
 */
export function usePaginatedWardrobe(initialLimit: number = 20): UsePaginatedWardrobeReturn {
  const [items, setItems] = useState<WardrobeItem[]>([])
  const [page, setPageState] = useState(1)
  const [limit, setLimitState] = useState(initialLimit)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Track if component is mounted to prevent state updates on unmount
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const fetchPage = useCallback(async (pageNum: number, pageLimit: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiFetch(
        `/api/wardrobe/items-paginated?page=${pageNum}&limit=${pageLimit}`,
        { method: 'GET' }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch wardrobe')
      }

      const data: PaginatedResponse = await response.json()

      if (isMountedRef.current) {
        // Decompress items (reverse of compressItem)
        const decompressed: WardrobeItem[] = data.items.map((item) => ({
          id: item.id,
          item_type: item.t,
          color: item.c,
          material: item.m,
          formality: item.f,
          fit: item.fi,
          silhouette: item.s,
          visual_weight: item.v,
          uploaded_at: item.u,
          imageUrl: item.img,
          description: item.desc,
        }))

        setItems(decompressed)
        setTotal(data.total)
        setHasMore(data.hasMore)
        setTotalPages(data.totalPages)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    fetchPage(page, limit)
  }, [page, limit, fetchPage])

  const setPage = useCallback((newPage: number) => {
    setPageState(Math.max(1, Math.min(newPage, totalPages || 1)))
  }, [totalPages])

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(Math.min(100, Math.max(1, newLimit)))
    setPageState(1) // Reset to first page when limit changes
  }, [])

  const refresh = useCallback(async () => {
    await fetchPage(page, limit)
  }, [page, limit, fetchPage])

  return {
    items,
    page,
    limit,
    total,
    hasMore,
    totalPages,
    loading,
    error,
    setPage,
    setLimit,
    refresh,
  }
}
