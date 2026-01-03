import { NextRequest } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/v1/admin/system/vapid')
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  return proxyToBackend(request, '/api/v1/admin/system/vapid', {
    method: 'PUT',
    body,
  })
}

export async function POST(request: NextRequest) {
  // Support POST for backwards compatibility, but proxy as PUT
  const body = await request.json().catch(() => ({}))
  return proxyToBackend(request, '/api/v1/admin/system/vapid', {
    method: 'PUT',
    body,
  })
}

export async function PATCH(request: NextRequest) {
  return proxyToBackend(request, '/api/v1/admin/system/vapid', {
    method: 'PATCH',
  })
}

