import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  try {
    return await proxyToBackend(request, '/api/v1/admin/system/labsmobile')
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/system/labsmobile:', error)
    return NextResponse.json({ config: null }, { status: 200 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    return await proxyToBackend(request, '/api/v1/admin/system/labsmobile', {
      method: 'PUT',
      body,
    })
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/system/labsmobile:', error)
    return NextResponse.json(
      { error: 'Backend endpoint not available' },
      { status: 500 }
    )
  }
}

