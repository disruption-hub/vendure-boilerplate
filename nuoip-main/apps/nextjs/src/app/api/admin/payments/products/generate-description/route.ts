import { NextRequest } from 'next/server'
import { proxyToBackend } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    return proxyToBackend(request, '/api/v1/admin/payments/products/generate-description')
}
