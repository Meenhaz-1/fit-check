import { NextResponse } from 'next/server'
import { testOpenAIConnection } from '@/lib/openai'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Test OpenAI connection
    const openaiOk = await testOpenAIConnection()

    // Test database connection
    let dbOk = false
    try {
      const result = db.prepare('SELECT 1').get()
      dbOk = !!result
    } catch (error) {
      console.error('Database test failed:', error)
    }

    const status = {
      timestamp: new Date().toISOString(),
      openai: openaiOk ? 'connected' : 'failed',
      database: dbOk ? 'connected' : 'failed',
      status: openaiOk && dbOk ? 'healthy' : 'degraded',
    }

    const statusCode = openaiOk && dbOk ? 200 : 503
    return NextResponse.json(status, { status: statusCode })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json(
      { error: 'Health check failed', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}
