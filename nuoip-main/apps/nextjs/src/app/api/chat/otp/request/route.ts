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
    console.log('[OTP Request API] Proxying request:', { 
      phone: body.phone, 
      tenantId: body.tenantId, 
      host: body.host,
      countryCode: body.countryCode 
    })
    
    const response = await proxyToBackend(request, '/api/v1/auth/phone/request', {
      method: 'POST',
      body,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      console.error('[OTP Request API] Backend error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
    }

    return response
  } catch (error) {
    console.error('[OTP Request API] Error proxying OTP request to backend:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { error: 'Failed to request OTP', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

