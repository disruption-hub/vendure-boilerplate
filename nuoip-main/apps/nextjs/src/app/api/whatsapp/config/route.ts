import { NextRequest } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  const path = queryString ? `/api/v1/admin/whatsapp/config?${queryString}` : '/api/v1/admin/whatsapp/config'
  return proxyToBackend(request, path)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  return proxyToBackend(request, '/api/v1/admin/whatsapp/config', {
    method: 'POST',
    body,
  })
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  return proxyToBackend(request, '/api/v1/admin/whatsapp/config', {
    method: 'PATCH',
    body,
  })
}

