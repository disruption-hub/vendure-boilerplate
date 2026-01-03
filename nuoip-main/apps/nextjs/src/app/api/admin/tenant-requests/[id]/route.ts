import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Tenant Requests API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const { id: requestId } = await params

    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing request ID' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    
    const response = await proxyToBackend(request, `/api/v1/admin/tenant-requests/${requestId}`, {
      method: 'PUT',
      body,
    })

    return response
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/tenant-requests:', error)
    return NextResponse.json(
      { error: 'Backend endpoint not available', message: 'The tenant requests endpoint is not yet implemented in the backend' },
      { status: 501 }
    )
  }
}

