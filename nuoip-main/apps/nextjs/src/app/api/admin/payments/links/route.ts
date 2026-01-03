import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  const path = queryString ? `/api/v1/admin/payments/links?${queryString}` : '/api/v1/admin/payments/links'
  return proxyToBackend(request, path)
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/api/v1/admin/payments/links')
}
