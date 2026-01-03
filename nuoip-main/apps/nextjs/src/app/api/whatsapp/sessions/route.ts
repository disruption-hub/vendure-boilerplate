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
    console.warn('[WhatsApp Sessions API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    const path = queryString ? `/api/v1/admin/whatsapp/sessions?${queryString}` : '/api/v1/admin/whatsapp/sessions'
    
    const response = await proxyToBackend(request, path)
    
    // If proxy returns an error, try to handle it gracefully
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[WhatsApp Sessions API] Backend error:', {
        status: response.status,
        error: errorData,
      })
      
      // For 500 errors from backend, return empty sessions array instead of error
      if (response.status === 500 || response.status >= 500) {
        console.warn('[WhatsApp Sessions API] Backend returned 500+, returning empty sessions array')
        return NextResponse.json({ sessions: [] }, { status: 200 })
      }
      
      // For 404, return empty array
      if (response.status === 404) {
        return NextResponse.json({ sessions: [] }, { status: 200 })
      }
      
      // For other errors, return the error response
      return response
    }
    
    return response
  } catch (error) {
    console.error('[WhatsApp Sessions API] Error:', error)
    // Return empty sessions array instead of 500 error to prevent UI breaking
    return NextResponse.json(
      { sessions: [] },
      { status: 200 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Check if Authorization header is present
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[WhatsApp Sessions API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    return proxyToBackend(request, '/api/v1/admin/whatsapp/sessions', {
      method: 'POST',
      body,
    })
  } catch (error) {
    console.error('[WhatsApp Sessions API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  // Check if Authorization header is present
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[WhatsApp Sessions API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('sessionId')
    const path = sessionId ? `/api/v1/admin/whatsapp/sessions?sessionId=${encodeURIComponent(sessionId)}` : '/api/v1/admin/whatsapp/sessions'
    return proxyToBackend(request, path, {
      method: 'DELETE',
    })
  } catch (error) {
    console.error('[WhatsApp Sessions API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

