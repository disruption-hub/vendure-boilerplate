import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  try {
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  const path = queryString ? `/api/v1/admin/schedule?${queryString}` : '/api/v1/admin/schedule'
    return await proxyToBackend(request, path)
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    return await proxyToBackend(request, '/api/v1/admin/schedule')
  } catch (error) {
    console.error('Error proxying to backend /api/v1/admin/schedule:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create schedule template' },
      { status: 500 }
    )
  }
}

