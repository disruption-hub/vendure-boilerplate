import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  try {
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  const path = queryString ? `/api/v1/crm/tickets?${queryString}` : '/api/v1/crm/tickets'
    
    console.log('[CRM Tickets API] Proxying to backend:', path)
    
    const response = await proxyToBackend(request, path)
    
    if (!response.ok) {
      console.error('[CRM Tickets API] Backend returned error:', {
        status: response.status,
        statusText: response.statusText,
        path,
      })
    }
    
    return response
  } catch (error) {
    console.error('[CRM Tickets API] Error proxying to backend:', error)
    return NextResponse.json(
      { error: 'Failed to load tickets', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  return proxyToBackend(request, '/api/v1/crm/tickets', {
    method: 'POST',
    body,
  })
}

