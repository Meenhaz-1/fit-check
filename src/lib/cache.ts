/**
 * Simple in-memory cache for outfit suggestions
 * Cache key format: "${itemId}:${itemType}"
 * TTL: 1 hour by default
 */

interface CacheEntry<T> {
  value: T
  timestamp: number
}

class Cache<T> {
  private store = new Map<string, CacheEntry<T>>()
  private ttl: number // in milliseconds

  constructor(ttlMinutes: number = 60) {
    this.ttl = ttlMinutes * 60 * 1000
  }

  set(key: string, value: T): void {
    this.store.set(key, {
      value,
      timestamp: Date.now(),
    })
  }

  get(key: string): T | null {
    const entry = this.store.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key)
      return null
    }

    return entry.value
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  clear(): void {
    this.store.clear()
  }

  size(): number {
    return this.store.size
  }

  stats(): { size: number; entries: string[] } {
    const entries = Array.from(this.store.entries())
      .filter(([_, entry]) => Date.now() - entry.timestamp <= this.ttl)
      .map(([key]) => key)

    return {
      size: entries.length,
      entries,
    }
  }
}

// Create outfit suggestions cache (60 minute TTL)
export const outfitCache = new Cache(60)
