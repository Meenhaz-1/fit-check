import { NextResponse } from 'next/server'
import { getMetrics, getCacheStats, getMetrics as getPerformanceMetrics } from '@/lib/performance'
import { getIndexStats } from '@/lib/db-queries'

/**
 * GET /api/health/performance
 *
 * Real-time performance monitoring for production
 * Use this endpoint to:
 * - Monitor cache hit rate
 * - Track API response times
 * - Monitor memory usage
 * - Alert on degradation
 */
export async function GET() {
  try {
    const metrics = getPerformanceMetrics()
    const cacheStats = getCacheStats()
    const indexStats = getIndexStats()

    const memUsage = process.memoryUsage()
    const uptime = process.uptime()

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.round(uptime),
          hours: Math.round(uptime / 3600),
        },
        performance: {
          cacheHitRate: `${Math.round(metrics.cacheHitRate * 100)}%`,
          avgResponseTimeMs: Math.round(metrics.apiResponseTime[0] ?? 0),
          avgPayloadSizeKB: Math.round(metrics.avgPayloadSize / 1024),
          recentResponseTimes: metrics.apiResponseTime.map((t) => Math.round(t)),
        },
        memory: {
          heapUsedMB: metrics.memoryUsage.heapUsed,
          heapTotalMB: metrics.memoryUsage.heapTotal,
          externalMB: metrics.memoryUsage.external,
          percentUsed: Math.round((metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100),
        },
        cache: {
          entries: cacheStats.entries,
          maxSize: cacheStats.maxSize,
        },
        database: {
          ...indexStats,
        },
        alerts: generateAlerts(metrics, memUsage),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Performance monitoring error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to gather metrics', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}

function generateAlerts(
  metrics: any,
  memUsage: NodeJS.MemoryUsage
): {
  critical: string[]
  warnings: string[]
} {
  const critical: string[] = []
  const warnings: string[] = []

  // Memory alerts
  const heapPercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100
  if (heapPercent > 90) {
    critical.push('CRITICAL: Heap usage above 90%')
  } else if (heapPercent > 75) {
    warnings.push('WARNING: Heap usage above 75%')
  }

  // Response time alerts
  const avgResponseTime = metrics.apiResponseTime[0] ?? 0
  if (avgResponseTime > 1000) {
    critical.push(`CRITICAL: API response time > 1000ms (${Math.round(avgResponseTime)}ms)`)
  } else if (avgResponseTime > 500) {
    warnings.push(`WARNING: API response time > 500ms (${Math.round(avgResponseTime)}ms)`)
  }

  // Cache hit rate alerts
  if (metrics.cacheHitRate < 0.3) {
    warnings.push(`WARNING: Cache hit rate < 30% (${Math.round(metrics.cacheHitRate * 100)}%)`)
  }

  return { critical, warnings }
}
