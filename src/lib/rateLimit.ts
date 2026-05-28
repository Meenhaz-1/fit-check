interface RateLimitEntry {
  count: number
  resetAt: number
}

const requestCounts = new Map<string, RateLimitEntry>()

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of requestCounts) {
    if (now > entry.resetAt + 60_000) requestCounts.delete(key)
  }
}

export function checkRateLimit(ip: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = requestCounts.get(ip)

  if (!entry || now > entry.resetAt) {
    if (requestCounts.size > 10_000) cleanup()
    requestCounts.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false
  entry.count++
  return true
}
