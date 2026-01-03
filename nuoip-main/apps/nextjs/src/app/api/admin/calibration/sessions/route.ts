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
  const path = queryString ? `/api/v1/admin/calibration/sessions?${queryString}` : '/api/v1/admin/calibration/sessions'
    return await proxyToBackend(request, path)
  } catch (error) {
    console.error('Error proxying calibration sessions:', error)
    // Return empty array if endpoint doesn't exist
    return NextResponse.json({ sessions: [] }, { status: 200 })
  }
}

