import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  // Check if Authorization header is present
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[WhatsApp Status API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }
    
    const queryString = searchParams.toString()
    const path = queryString ? `/api/v1/admin/whatsapp/status?${queryString}` : '/api/v1/admin/whatsapp/status'
    
    const response = await proxyToBackend(request, path)
    
    // If backend returns an error, return a graceful response instead of 500
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.warn('[WhatsApp Status API] Backend error:', {
        status: response.status,
        sessionId,
        error: errorData,
      })
      
      // Return a default status instead of error to prevent UI breaking
      if (response.status >= 500 || response.status === 404) {
        return NextResponse.json({
          status: 'DISCONNECTED',
          socketStatus: 'disconnected',
        })
      }
      
      return response
    }
    
    return response
  } catch (error) {
    console.error('[WhatsApp Status API] Error:', error)
    // Return a default status instead of 500 to prevent UI breaking
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')
    return NextResponse.json({
      status: 'DISCONNECTED',
      socketStatus: 'disconnected',
    })
  }
}

