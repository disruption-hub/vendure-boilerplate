import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Simply proxy through to the backend Lyra initializer endpoint
  const backendPath = `/api/v1/payments/link/${token}/lyra-form`
  const body = await request.json().catch(() => ({}))

  return proxyToBackend(request, backendPath, {
    method: 'POST',
    body,
  })
}


