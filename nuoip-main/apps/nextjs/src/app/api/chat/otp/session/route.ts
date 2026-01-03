import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    
    const response = await proxyToBackend(request, '/api/v1/auth/phone/session', {
      method: 'POST',
      body,
    })

    return response
  } catch (error) {
    console.error('Error proxying session load to backend:', error)
    return NextResponse.json(
      { error: 'Failed to load session', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Try to parse body, but don't fail if it's empty or invalid
    let body: any = {}
    try {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    } catch {
      // Body is optional for DELETE, continue without it
      body = {}
    }
    
    const response = await proxyToBackend(request, '/api/v1/auth/phone/session', {
      method: 'DELETE',
      body: Object.keys(body).length > 0 ? body : undefined,
    })

    return response
  } catch (error) {
    console.error('Error proxying session revoke to backend:', error)
    // Return success even if revoke fails, as the session is already cleared client-side
    return NextResponse.json(
      { success: true, error: 'Failed to revoke session on server', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 200 }
    )
  }
}

