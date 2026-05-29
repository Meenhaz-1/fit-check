/**
 * IMAGE OPTIMIZATION UTILITIES
 *
 * Problem: 190MB of unoptimized images
 * Solution: Lazy load, compress on upload, serve thumbnails
 *
 * Expected savings:
 * - Thumbnail serving: ~10KB per image vs 8MB original (99.9% reduction)
 * - Lazy loading: Only load visible images
 * - WebP compression: 25-35% smaller than JPEG
 */

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0-100, default 80
  format?: 'webp' | 'jpeg' | 'png'
}

export interface ImageMetadata {
  width: number
  height: number
  size: number
  format: string
  isOptimized: boolean
}

/**
 * CLIENT-SIDE: Generate thumbnail URL without reprocessing
 *
 * Instead of storing full images, serve from CDN with params:
 * /api/images/item_123?w=200&h=200&q=70&fmt=webp
 *
 * This requires setting up image optimization middleware (see routes)
 */
export function getThumbnailUrl(imageUrl: string, width: number = 200, height: number = 200): string {
  if (!imageUrl) return ''

  // Already optimized CDN URL
  if (imageUrl.includes('cdn.')) {
    return imageUrl
  }

  // Local image - add optimization params
  const params = new URLSearchParams({
    w: width.toString(),
    h: height.toString(),
    q: '70', // 70% quality for thumbnails
    fmt: 'webp',
  })

  return `${imageUrl}?${params.toString()}`
}

/**
 * SERVER-SIDE: Estimate if image needs optimization
 */
export function estimateCompressionSavings(
  originalSizeBytes: number,
  format: string = 'jpeg'
): {
  compressed: number
  savings: string
  ratio: number
} {
  // Rough estimates
  const compressionRatios: Record<string, number> = {
    jpeg: 0.65, // WebP is ~35% smaller
    png: 0.4, // PNG to WebP is huge
    webp: 1.0,
  }

  const ratio = compressionRatios[format.toLowerCase()] || 0.65
  const compressed = Math.round(originalSizeBytes * ratio)
  const savingsBytes = originalSizeBytes - compressed
  const savingsPercent = Math.round((savingsBytes / originalSizeBytes) * 100)

  return {
    compressed,
    savings: `${savingsPercent}%`,
    ratio,
  }
}

/**
 * LAZY LOADING: Track which images should load
 *
 * Usage:
 * const imageRef = useRef<HTMLImageElement>(null)
 * const [shouldLoad, setShouldLoad] = useState(false)
 *
 * useEffect(() => {
 *   const observer = new IntersectionObserver(([entry]) => {
 *     setShouldLoad(entry.isIntersecting)
 *   })
 *   if (imageRef.current) observer.observe(imageRef.current)
 *   return () => observer.disconnect()
 * }, [])
 *
 * <img ref={imageRef} src={shouldLoad ? url : ''} loading="lazy" />
 */
export function createLazyImageElement(
  src: string,
  alt: string,
  thumbnailUrl: string
): HTMLImageElement {
  const img = new Image()
  img.src = thumbnailUrl
  img.alt = alt
  img.loading = 'lazy'
  img.className = 'w-full h-full object-cover'

  // Load full image when in viewport
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      img.src = src
      observer.unobserve(img)
    }
  })

  observer.observe(img)
  return img
}

/**
 * Memory pooling for image data
 *
 * Instead of creating new ArrayBuffers for each image,
 * reuse buffers to reduce GC pressure
 */
export class ImageBufferPool {
  private pool: Map<number, ArrayBuffer[]> = new Map()
  private maxPerSize = 5

  acquire(size: number): ArrayBuffer {
    const buffers = this.pool.get(size) || []
    if (buffers.length > 0) {
      return buffers.pop()!
    }
    return new ArrayBuffer(size)
  }

  release(buffer: ArrayBuffer): void {
    const size = buffer.byteLength
    const buffers = this.pool.get(size) || []

    if (buffers.length < this.maxPerSize) {
      buffers.push(buffer)
      this.pool.set(size, buffers)
    }
  }

  clear(): void {
    this.pool.clear()
  }

  getStats() {
    let totalBuffers = 0
    let totalMemory = 0

    for (const [size, buffers] of this.pool.entries()) {
      totalBuffers += buffers.length
      totalMemory += size * buffers.length
    }

    return {
      totalBuffers,
      totalMemory: Math.round(totalMemory / 1024 / 1024),
      poolSizes: Array.from(this.pool.entries()).map(([size, buffers]) => ({
        size,
        count: buffers.length,
      })),
    }
  }
}

/**
 * SRCSET GENERATION: Serve responsive images
 *
 * Usage: <img srcSet={generateSrcSet('/img.jpg')} sizes="..." />
 *
 * Browsers automatically pick best resolution
 */
export function generateSrcSet(imageUrl: string): string {
  const sizes = [200, 400, 800, 1200]
  return sizes.map((size) => `${getThumbnailUrl(imageUrl, size)} ${size}w`).join(', ')
}

/**
 * WEBP FALLBACK: Modern format with fallback
 *
 * Usage:
 * <picture>
 *   <source srcSet={generateSrcSet(url, 'webp')} type="image/webp" />
 *   <img src={generateSrcSet(url, 'jpeg')} />
 * </picture>
 */
export function generateSrcSetWithFormat(imageUrl: string, format: 'webp' | 'jpeg'): string {
  const sizes = [200, 400, 800, 1200]
  return sizes.map((size) => `${getThumbnailUrl(imageUrl, size)} ${size}w`).join(', ')
}
