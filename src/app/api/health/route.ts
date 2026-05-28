import { NextResponse } from 'next/server'
import { getDatabaseStatus } from '@/lib/db'

export async function GET() {
  try {
    const dbStatus = getDatabaseStatus()

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: dbStatus.connected ? 'healthy' : 'degraded',
      },
      { status: dbStatus.connected ? 200 : 503 }
    )
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}
