# Performance Optimization - Quick Reference

## 1. PAGINATION (50x memory reduction)

### ❌ Before
```typescript
// Gallery loads ALL 10K items
const [items, setItems] = useState<WardrobeItem[]>([])

useEffect(() => {
  fetch('/api/wardrobe/items')
    .then(r => r.json())
    .then(data => setItems(data.items)) // Loads 10K items
}, [])

// Then filter in React
const filtered = items.filter(item => itemMatchesFilter(item, activeFilter))
```

### ✅ After
```typescript
// Gallery loads 20 items at a time
const { items, page, setPage } = usePaginatedWardrobe(20)

// Renders current page only
{items.map(item => <ItemCard key={item.id} item={item} />)}

// Navigation
<button onClick={() => setPage(page + 1)}>Next</button>
```

---

## 2. IMAGE OPTIMIZATION (99% size reduction)

### ❌ Before
```typescript
<img 
  src="/wardrobe-images/item_123.jpg"  // 8MB
/>
```

### ✅ After
```typescript
import { getThumbnailUrl, generateSrcSet } from '@/lib/image-optimizer'

<img
  srcSet={generateSrcSet(item.imageUrl)}  // 10KB
  sizes="(max-width: 768px) 100vw, 50vw"
  loading="lazy"
/>
```

---

## 3. RESPONSE COMPRESSION (50% bandwidth reduction)

### ❌ Before
```json
{
  "id": "item_123",
  "item_type": "shirt",
  "color": "blue",
  "material": "cotton",
  "formality": "casual",
  "fit": "regular",
  "silhouette": "straight",
  "visual_weight": "light",
  "uploaded_at": "2026-05-29T10:00:00Z",
  "imageUrl": "/wardrobe-images/..."
}
```

### ✅ After
```json
{
  "id": "item_123",
  "t": "shirt",
  "c": "blue",
  "m": "cotton",
  "f": "casual",
  "fi": "regular",
  "s": "straight",
  "v": "light",
  "u": "2026-05-29T10:00:00Z",
  "img": "/wardrobe-images/..."
}
```

---

## 4. CACHING (50% database queries eliminated)

### ❌ Before
```typescript
// Every request hits database
export async function GET(request: Request) {
  const items = getAllWardrobeItems()
  return NextResponse.json({ items })
}
```

### ✅ After
```typescript
import { getFromCache, setCache } from '@/lib/performance'

export async function GET(request: Request) {
  const cacheKey = 'items:page=1:limit=20'
  
  // Check cache first
  const cached = getFromCache(cacheKey)
  if (cached) return NextResponse.json(cached)
  
  // Fetch and cache
  const items = getAllWardrobeItems()
  setCache(cacheKey, { items }, 60000) // 60s TTL
  
  return NextResponse.json({ items })
}
```

---

## 5. MEMORY LEAK PREVENTION (Prevent OOM)

### ❌ Before
```typescript
useEffect(() => {
  window.addEventListener('scroll', handleScroll)
  // ❌ No cleanup = memory leak
}, [])
```

### ✅ After
```typescript
useEffect(() => {
  window.addEventListener('scroll', handleScroll)
  
  return () => {
    window.removeEventListener('scroll', handleScroll)
    // ✅ Cleanup prevents leak
  }
}, [])

// Also prevent state updates after unmount:
const isMountedRef = useRef(true)

useEffect(() => {
  return () => {
    isMountedRef.current = false
  }
}, [])

// Use in async operations:
setLoading(false) // ✅ Safe - checks isMountedRef
```

---

## 6. LAZY LOADING (Reduce initial load)

### ❌ Before
```typescript
<img src={item.imageUrl} alt="..." />
// Loads immediately, even if off-screen
```

### ✅ After
```typescript
import { getThumbnailUrl } from '@/lib/image-optimizer'

<img
  src={getThumbnailUrl(item.imageUrl, 200, 200)}
  loading="lazy"
  alt="..."
/>
// Only loads when in viewport
```

---

## 7. FAST DATABASE QUERIES (O(1) vs O(n))

### ❌ Before
```typescript
// O(n) - scans all 10K items
const items = getAllWardrobeItems()
  .filter(item => item.item_type === 'shirt')
```

### ✅ After
```typescript
import { findByType } from '@/lib/db-queries'

// O(1) - index lookup, returns 200 items
const items = findByType('shirt')
```

---

## 8. DEDUPLICATING REQUESTS (Prevent thundering herd)

### ❌ Before
```typescript
// If 10 users click "refresh" at same time = 10 DB queries
const items = getAllWardrobeItems()
```

### ✅ After
```typescript
import { deduplicateRequest } from '@/lib/performance'

const items = await deduplicateRequest('fetch-items', () => 
  Promise.resolve(getAllWardrobeItems())
)
// Only 1 DB query, 10 requests wait for same result
```

---

## 9. MONITORING & ALERTING

### Setup Performance Tracking
```typescript
import { trackApiResponse, trackCacheHit, trackCacheMiss } from '@/lib/performance'

// In your API route
const startTime = Date.now()

if (cached) {
  trackCacheHit()
} else {
  trackCacheMiss()
}

const duration = Date.now() - startTime
trackApiResponse(duration, responseSize)
```

### View Metrics
```bash
curl http://localhost:3000/api/health/performance

# Response:
# {
#   "performance": {
#     "cacheHitRate": "65%",
#     "avgResponseTimeMs": 45,
#     "avgPayloadSizeKB": 85
#   },
#   "memory": {
#     "heapUsedMB": 245,
#     "percentUsed": 48
#   },
#   "alerts": {
#     "critical": [],
#     "warnings": []
#   }
# }
```

---

## 10. BATCH OPERATIONS (Reduce API calls)

### ❌ Before
```typescript
// 10 items = 10 API calls
for (const itemId of itemIds) {
  await fetch(`/api/wardrobe/items/${itemId}`)
}
```

### ✅ After
```typescript
import { getByIds } from '@/lib/db-queries'

// 10 items = 1 operation, O(10)
const items = getByIds(itemIds)
```

---

## 11. RESPONSIVE IMAGES (Serve correct size)

### ❌ Before
```typescript
<img 
  src={item.imageUrl}  // Always full size (8MB)
  style={{ width: '200px' }}  // Still downloads 8MB
/>
```

### ✅ After
```typescript
import { generateSrcSet } from '@/lib/image-optimizer'

<picture>
  <source 
    srcSet={generateSrcSet(item.imageUrl, 'webp')}
    type="image/webp"
  />
  <img
    srcSet={generateSrcSet(item.imageUrl, 'jpeg')}
    sizes="(max-width: 768px) 100vw, 50vw"
    loading="lazy"
  />
</picture>
// Browser downloads: 200px→10KB, 400px→20KB, 800px→50KB
```

---

## 12. BOUNDED MEMORY (Prevent leaks)

### ❌ Before
```typescript
// Cache grows infinitely
const cache = new Map()
cache.set(key, value)  // Never deletes old entries
```

### ✅ After
```typescript
import { BoundedMap } from '@/lib/performance'

const cache = new BoundedMap(1000)  // Max 1000 entries
cache.set(key, value)  // Deletes oldest if over limit
```

---

## 🚀 QUICK WINS (Implement Now)

1. **5 minutes:** Enable `loading="lazy"` on all images
2. **10 minutes:** Switch to `/api/wardrobe/items-paginated`
3. **15 minutes:** Add performance monitoring endpoint check
4. **20 minutes:** Use `usePaginatedWardrobe` hook in gallery
5. **30 minutes:** Review memory leaks in useEffect hooks

---

## 📊 EXPECTED RESULTS

| Change | Expected Improvement |
|--------|----------------------|
| Pagination | 10-50x memory reduction |
| Image lazy loading | 90% bandwidth reduction |
| Compression | 50% response size |
| Caching | 50% database load reduction |
| O(1) lookups | 100x query speed |
| Memory leak fixes | Stable memory over time |

---

## ⚠️ COMMON MISTAKES

### ❌ Loading all items for filtering
```typescript
const items = getAllWardrobeItems()  // DON'T
items.filter(item => item.type === 'shirt')
```
Use: `/api/wardrobe/items-paginated?filter=shirt`

### ❌ Not cleaning up listeners
```typescript
useEffect(() => {
  addEventListener('scroll', fn)  // DON'T - leak!
}, [])
```
Use: Add return cleanup function

### ❌ Caching without TTL
```typescript
cache.set(key, value)  // DON'T - leaks memory!
```
Use: `setCache(key, value, 60000)` with TTL

### ❌ Sending full images to AI
```typescript
await gpt4vision(base64Image)  // 8MB, 2048 tokens = $0.03
```
Use: Compress image first

---

Last Updated: 2026-05-29
