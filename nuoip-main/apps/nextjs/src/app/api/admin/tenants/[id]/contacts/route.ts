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
    console.warn('[Tenants Contacts API] No Authorization header found')
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

    const response = await proxyToBackend(request, `/api/v1/admin/tenants/${tenantId}/contacts`, {
      method: 'GET',
    })

    return response
  } catch (error) {
    console.error('[Tenants Contacts API] Error proxying to backend:', error)
    return NextResponse.json(
      { error: 'Backend endpoint not available', message: 'The contacts endpoint is not yet implemented in the backend' },
      { status: 501 }
    )
  }
}

