import { NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  // Read environment variables at runtime (not build time)
  // This ensures localhost works when env vars are set
  let backendUrl: string = process.env.NEXT_PUBLIC_BACKEND_URL || 
                          process.env.BACKEND_URL || 
                          ''
  
  if (backendUrl) {
    backendUrl = backendUrl.replace(/\/+$/, '') // Remove trailing slashes
  } else {
    // For localhost: Check if we're deployed (Vercel or Railway)
    // If not deployed, use localhost
    const hasVercelEnv = !!(process.env.VERCEL || process.env.VERCEL_URL || process.env.VERCEL_ENV)
    const hasRailwayEnv = !!(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_ENVIRONMENT_NAME)
    const isDeployed = hasVercelEnv || hasRailwayEnv
    
    backendUrl = !isDeployed
      ? 'http://localhost:3001'
      : 'https://nuoip-production.up.railway.app'
  }
  
  console.log('[Health Check] Backend URL:', backendUrl, {
    hasNextPublic: !!process.env.NEXT_PUBLIC_BACKEND_URL,
    hasBackend: !!process.env.BACKEND_URL,
    VERCEL: process.env.VERCEL,
    VERCEL_URL: process.env.VERCEL_URL,
  })
  
  const healthUrl = `${backendUrl}/api/v1/health`

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        status: 'connected',
        backend: backendUrl,
        health: data,
      })
    } else {
      return NextResponse.json({
        status: 'error',
        backend: backendUrl,
        message: `Backend returned ${response.status}`,
      }, { status: 503 })
    }
  } catch (error) {
    return NextResponse.json({
      status: 'disconnected',
      backend: backendUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Backend service is not accessible. Please ensure the Railway backend is deployed and running.',
    }, { status: 503 })
  }
}
