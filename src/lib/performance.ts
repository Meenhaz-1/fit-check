// Performance optimization utilities for production scale

import { createHash } from 'crypto'

// ─────────────────────────────────────────────────────────────────────────
// RESPONSE CACHING: Eliminate redundant API calls
// ─────────────────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

const responseCache = new Map<string, CacheEntry<any>>()

export function getCacheKey(endpoint: string, params?: Record<string, any>): string {
  const paramsStr = params ? JSON.stringify(params) : ''
  return `${endpoint}:${paramsStr}`
}

export function getFromCache<T>(key: string): T | null {
  const entry = responseCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > entry.ttl) {
    responseCache.delete(key)
    return null
  }
  return entry.data
}

export function setCache<T>(key: string, data: T, ttlMs: number = 60000): void {
  responseCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  })
}

export function clearCache(pattern?: string): void {
  if (!pattern) {
    responseCache.clear()
  } else {
    const regex = new RegExp(pattern)
    for (const key of responseCache.keys()) {
      if (regex.test(key)) responseCache.delete(key)
    }
  }
}

export function getCacheStats() {
  return {
    entries: responseCache.size,
    maxSize: 1000, // Limit cache to prevent memory bloat
  }
}

// ─────────────────────────────────────────────────────────────────────────
// PAGINATION HELPER: Efficient list loading
// ─────────────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
  hasMore: boolean
  totalPages: number
}

export function paginate<T>(
  items: T[],
  page: number,
  limit: number,
  compareFn?: (a: T, b: T) => number
): PaginatedResponse<T> {
  const total = items.length
  const totalPages = Math.ceil(total / limit)

  // Validate pagination params
  const safePage = Math.max(1, Math.min(page, totalPages || 1))
  const safeLimit = Math.min(limit, 100) // Cap at 100 items per page

  const start = (safePage - 1) * safeLimit
  const end = start + safeLimit

  let sortedItems = [...items]
  if (compareFn) {
    sortedItems.sort(compareFn)
  }

  return {
    data: sortedItems.slice(start, end),
    page: safePage,
    limit: safeLimit,
    total,
    hasMore: safePage * safeLimit < total,
    totalPages,
  }
}

// ─────────────────────────────────────────────────────────────────────────
// IMAGE OPTIMIZATION: Reduce memory and bandwidth
// ─────────────────────────────────────────────────────────────────────────

export function stripImageMetadata(base64: string): string {
  // Remove data URL prefix if present (saves ~30 bytes per request)
  if (base64.startsWith('data:')) {
    return base64.split(',')[1] || base64
  }
  return base64
}

export function estimateImageSize(base64Length: number): number {
  // Rough estimate: base64 is ~1.33x larger than binary
  return Math.round((base64Length * 3) / 4 / 1024 / 1024 * 100) / 100 // MB
}

export function getImageHash(imageData: string): string {
  return createHash('md5').update(imageData.slice(0, 1000)).digest('hex')
}

// ─────────────────────────────────────────────────────────────────────────
// RESPONSE COMPRESSION: Reduce payload size
// ─────────────────────────────────────────────────────────────────────────

export interface CompactWardrobeItem {
  id: string
  t: string // item_type
  c: string // color
  m: string // material
  f: string // formality
  fi: string // fit
  s: string // silhouette
  v: string // visual_weight
  u: string // uploaded_at (ISO timestamp)
  img?: string // imageUrl
  desc?: string // description
}

export function compressItem(item: Record<string, any>): CompactWardrobeItem {
  return {
    id: item.id,
    t: item.item_type,
    c: item.color,
    m: item.material,
    f: item.formality,
    fi: item.fit,
    s: item.silhouette,
    v: item.visual_weight,
    u: item.uploaded_at,
    img: item.imageUrl,
    desc: item.description,
  }
}

export function decompressItem(item: CompactWardrobeItem): Record<string, any> {
  return {
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
  }
}

// ─────────────────────────────────────────────────────────────────────────
// MEMORY MANAGEMENT: Prevent leaks and bloat
// ─────────────────────────────────────────────────────────────────────────

export class BoundedMap<K, V> extends Map<K, V> {
  private maxSize: number

  constructor(maxSize: number = 1000) {
    super()
    this.maxSize = maxSize
  }

  set(key: K, value: V): this {
    // Remove oldest entry if at capacity
    if (this.size >= this.maxSize && !this.has(key)) {
      const firstKey = this.keys().next().value
      if (firstKey) this.delete(firstKey)
    }
    return super.set(key, value)
  }
}

// ─────────────────────────────────────────────────────────────────────────
// REQUEST DEDUPLICATION: Prevent thundering herd
// ─────────────────────────────────────────────────────────────────────────

const pendingRequests = new Map<string, Promise<any>>()

export async function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  // If request already in flight, return existing promise
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }

  // Initiate request and cache the promise
  const promise = requestFn()
    .catch((error) => {
      pendingRequests.delete(key)
      throw error
    })
    .then((result) => {
      pendingRequests.delete(key)
      return result
    })

  pendingRequests.set(key, promise)
  return promise
}

// ─────────────────────────────────────────────────────────────────────────
// MONITORING: Track performance metrics
// ─────────────────────────────────────────────────────────────────────────

export interface PerformanceMetrics {
  apiResponseTime: number[]
  cacheHitRate: number
  avgPayloadSize: number
  memoryUsage: {
    heapUsed: number
    heapTotal: number
    external: number
  }
}

const metrics = {
  apiResponseTimes: [] as number[],
  cacheHits: 0,
  cacheMisses: 0,
  totalPayloadSize: 0,
  requestCount: 0,
}

export function trackApiResponse(durationMs: number, payloadSize: number): void {
  metrics.apiResponseTimes.push(durationMs)
  metrics.totalPayloadSize += payloadSize
  metrics.requestCount++

  // Keep only last 1000 measurements
  if (metrics.apiResponseTimes.length > 1000) {
    metrics.apiResponseTimes.shift()
  }
}

export function trackCacheHit(): void {
  metrics.cacheHits++
}

export function trackCacheMiss(): void {
  metrics.cacheMisses++
}

export function getMetrics(): PerformanceMetrics {
  const avgResponseTime =
    metrics.apiResponseTimes.length > 0
      ? metrics.apiResponseTimes.reduce((a, b) => a + b, 0) / metrics.apiResponseTimes.length
      : 0

  const totalRequests = metrics.cacheHits + metrics.cacheMisses
  const cacheHitRate = totalRequests > 0 ? (metrics.cacheHits / totalRequests) * 100 : 0

  const memoryUsage = process.memoryUsage()

  return {
    apiResponseTime: metrics.apiResponseTimes.slice(-10), // Last 10
    cacheHitRate,
    avgPayloadSize: metrics.requestCount > 0 ? metrics.totalPayloadSize / metrics.requestCount : 0,
    memoryUsage: {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    },
  }
}

export function resetMetrics(): void {
  metrics.apiResponseTimes = []
  metrics.cacheHits = 0
  metrics.cacheMisses = 0
  metrics.totalPayloadSize = 0
  metrics.requestCount = 0
}
