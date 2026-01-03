import { NextRequest } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  const path = queryString ? `/api/v1/admin/payments/reports?${queryString}` : '/api/v1/admin/payments/reports'
  return proxyToBackend(request, path)
}

