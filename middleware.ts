import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Health endpoint is exempt from all checks
  if (pathname === '/api/health') {
    return NextResponse.next()
  }

  // API Secret authentication (for production)
  const secret = process.env.API_SECRET
  if (secret) {
    const token = request.headers.get('x-api-key')
    if (!token || token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Rate limiting for specific routes
  const RATE_LIMIT_RULES: Record<string, { limit: number; window: number }> = {
    '/api/wardrobe/save': { limit: 60, window: 60_000 },
    '/api/wardrobe/evaluate-item': { limit: 20, window: 60_000 },
    '/api/wardrobe/outfit-builder': { limit: 60, window: 60_000 },
  }

  const route = Object.keys(RATE_LIMIT_RULES).find((pattern) => pathname.startsWith(pattern))
  if (route) {
    const rules = RATE_LIMIT_RULES[route]
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'

    if (!checkRateLimit(ip, rules.limit, rules.window)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
