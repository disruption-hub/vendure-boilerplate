import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function POST(request: NextRequest) {
  // Check if Authorization header is present
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[WhatsApp Disconnect API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    return proxyToBackend(request, '/api/v1/admin/whatsapp/disconnect', {
      method: 'POST',
      body,
    })
  } catch (error) {
    console.error('[WhatsApp Disconnect API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

