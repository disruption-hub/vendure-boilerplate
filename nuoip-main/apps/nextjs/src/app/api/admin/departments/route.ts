import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Departments API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const queryString = searchParams.toString()
    const path = queryString ? `/api/v1/admin/departments?${queryString}` : '/api/v1/admin/departments'
    return proxyToBackend(request, path)
  } catch (error) {
    console.error('[Departments API] Error proxying to backend:', error)
    return NextResponse.json(
      { error: 'Backend endpoint not available', message: 'The departments endpoint is not yet implemented in the backend' },
      { status: 501 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Departments API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    return proxyToBackend(request, '/api/v1/admin/departments', {
      method: 'POST',
      body,
    })
  } catch (error) {
    console.error('[Departments API] Error proxying to backend:', error)
    return NextResponse.json(
      { error: 'Backend endpoint not available', message: 'The departments endpoint is not yet implemented in the backend' },
      { status: 501 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Departments API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    return proxyToBackend(request, '/api/v1/admin/departments', {
      method: 'PUT',
      body,
    })
  } catch (error) {
    console.error('[Departments API] Error proxying to backend:', error)
    return NextResponse.json(
      { error: 'Backend endpoint not available', message: 'The departments endpoint is not yet implemented in the backend' },
      { status: 501 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader) {
    console.warn('[Departments API] No Authorization header found')
    return NextResponse.json(
      { error: 'Unauthorized: No token provided' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    return proxyToBackend(request, '/api/v1/admin/departments', {
      method: 'DELETE',
      body,
    })
  } catch (error) {
    console.error('[Departments API] Error proxying to backend:', error)
    return NextResponse.json(
      { error: 'Backend endpoint not available', message: 'The departments endpoint is not yet implemented in the backend' },
      { status: 501 }
    )
  }
}

