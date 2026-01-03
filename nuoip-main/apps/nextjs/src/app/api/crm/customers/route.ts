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
    const authHeader = request.headers.get('authorization')

    console.log('[CRM Customers API] Request received', {
      hasTenantId: !!body.tenantId,
      hasPhone: !!body.phone,
      hasEmail: !!body.email,
      hasAuth: !!authHeader,
    })

    // Proxy to backend CRM customers endpoint (POST with body)
    const response = await proxyToBackend(request, '/api/v1/crm/customers', {
      method: 'POST',
      body,
      headers: authHeader ? { 'Authorization': authHeader } : {},
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[CRM Customers API] Backend error', {
        status: response.status,
        error: errorText.substring(0, 200),
      })
    }

    return response
  } catch (error) {
    console.error('[CRM Customers API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load customers', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

