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
    console.warn('[Users API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const { id: userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      )
    }

    const body = await request.json().catch(() => ({}))
    
    const response = await proxyToBackend(request, `/api/v1/admin/users/${userId}`, {
      method: 'PUT',
      body,
    })

    return response
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/users:', error)
    return NextResponse.json(
      { error: 'Backend endpoint not available', message: 'The users endpoint is not yet implemented in the backend' },
      { status: 501 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Users API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const { id: userId } = await params

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 400 }
      )
    }

    const response = await proxyToBackend(request, `/api/v1/admin/users/${userId}`, {
      method: 'DELETE',
    })

    return response
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/users:', error)
    return NextResponse.json(
      { error: 'Backend endpoint not available', message: 'The users endpoint is not yet implemented in the backend' },
      { status: 501 }
    )
  }
}

