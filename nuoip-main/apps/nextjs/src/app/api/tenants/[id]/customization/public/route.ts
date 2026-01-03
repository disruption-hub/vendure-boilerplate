import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tenantIdOrKey } = await params

    if (!tenantIdOrKey) {
      return NextResponse.json(
        { error: 'Missing tenant ID or key' },
        { status: 400 }
      )
    }

    console.log('[Public Customization API] Fetching for tenant:', tenantIdOrKey)

    // Public endpoint - no auth required
    // Backend customization endpoint handles subdomain -> UUID resolution internally
    const response = await proxyToBackend(request, `/api/v1/admin/tenants/${encodeURIComponent(tenantIdOrKey)}/customization`, {
      method: 'GET',
    })

    // If backend returns 404, return empty customization
    if (response.status === 404) {
      console.log('[Public Customization API] No customization found (404) for:', tenantIdOrKey)
      return NextResponse.json({
        customization: null,
      })
    }

    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      console.log('[Public Customization API] Successfully fetched for:', tenantIdOrKey)
      // Normalize response format
      if (data.customization !== undefined) {
        return NextResponse.json(data)
      }
      // If backend returns different format, wrap it
      return NextResponse.json({
        customization: data,
      })
    }

    return response
  } catch (error) {
    console.error('[Public Customization API] Error fetching tenant customization:', error)
    // Return empty customization on error
    return NextResponse.json({
      customization: null,
    })
  }
}
