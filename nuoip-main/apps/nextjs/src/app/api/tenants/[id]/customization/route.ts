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
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Tenant Customization API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const { id: tenantId } = await params
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant ID' },
        { status: 400 }
      )
    }

    const response = await proxyToBackend(request, `/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/customization`)
    
    // If backend returns 404, return empty customization
    if (response.status === 404) {
      return NextResponse.json({
        customization: null,
      })
    }

    if (response.ok) {
      const data = await response.json().catch(() => ({}))
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
    console.error('Error proxying to backend /api/v1/admin/tenants/[id]/customization:', error)
    // Return empty customization on error
    return NextResponse.json({
      customization: null,
    })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Tenant Customization API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const { id: tenantId } = await params
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant ID' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))

    const response = await proxyToBackend(request, `/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/customization`, {
      method: 'PUT',
      body,
    })

    // If backend returns 404, return success with the provided data
    if (response.status === 404) {
      return NextResponse.json({
        customization: body.customization || null,
      })
    }

    return response
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/tenants/[id]/customization:', error)
    return NextResponse.json(
      { error: 'Backend endpoint not available', message: 'The tenant customization endpoint is not yet implemented in the backend' },
      { status: 501 }
    )
  }
}

