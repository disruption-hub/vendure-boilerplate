import { NextRequest } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleCORS()
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // Don't read the body here - let proxyToBackend handle it
  // The proxy function will read the body from the request
  return proxyToBackend(request, `/api/v1/admin/payments/products/${id}`, {
    method: 'PUT',
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return proxyToBackend(request, `/api/v1/admin/payments/products/${id}`, {
    method: 'DELETE',
  })
}

