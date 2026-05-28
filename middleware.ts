import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Health endpoint is exempt so monitoring tools can reach it without credentials
  if (request.nextUrl.pathname === '/api/health') {
    return NextResponse.next()
  }

  const secret = process.env.API_SECRET
  // When API_SECRET is not set (local dev), all requests are allowed
  if (!secret) {
    return NextResponse.next()
  }

  const token = request.headers.get('x-api-key')
  if (!token || token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
