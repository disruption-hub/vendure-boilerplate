import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    const authHeader = request.headers.get('authorization')
    
    // Build query string if token is provided
    const queryString = token ? `?token=${encodeURIComponent(token)}` : ''
    
    const response = await proxyToBackend(request, `/api/v1/auth/phone/profile${queryString}`, {
      method: 'GET',
      headers: authHeader ? { 'Authorization': authHeader } : {},
    })

    return response
  } catch (error) {
    console.error('Error proxying profile fetch to backend:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    
    const response = await proxyToBackend(request, '/api/v1/auth/phone/profile', {
      method: 'PUT',
      body,
    })

    return response
  } catch (error) {
    console.error('Error proxying profile update to backend:', error)
    return NextResponse.json(
      { error: 'Failed to update profile', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

