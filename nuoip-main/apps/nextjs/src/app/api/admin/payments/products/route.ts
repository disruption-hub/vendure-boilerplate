import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return proxyToBackend(request, '/api/v1/admin/payments/products')
}

export async function POST(request: NextRequest) {
  return proxyToBackend(request, '/api/v1/admin/payments/products')
}



