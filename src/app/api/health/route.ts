import { NextResponse } from 'next/server'
import { getDataService } from '@/lib/config/database'

/**
 * GET /api/health - Point de contrôle de santé du système F1.3
 */
export async function GET() {
  try {
    const dataService = getDataService()
    
    const health = await dataService.healthCheck()
    const stats = await dataService.getSystemStats()
    
    const status = health.database && health.cache ? 200 : 503
    
    return NextResponse.json({
      status: status === 200 ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: health.database ? 'up' : 'down',
          stats: {
            totalUsers: stats.database.totalUsers,
            totalJardins: stats.database.totalJardins,
            totalRecoltes: stats.database.totalRecoltes
          }
        },
        cache: {
          status: health.cache ? 'up' : 'down',
          stats: {
            memory: stats.cache.memory,
            keys: stats.cache.keys,
            hitRate: stats.cache.hitRate
          }
        }
      },
      errors: health.errors,
      version: '1.3.0',
      environment: process.env.NODE_ENV || 'development',
      feature: 'F1.3 - Base de Données & Modèles Core'
    }, { status })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      environment: process.env.NODE_ENV || 'development'
    }, { status: 503 })
  }
}