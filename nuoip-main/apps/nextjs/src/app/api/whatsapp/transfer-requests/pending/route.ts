import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
    return handleCORS()
}

// Get pending transfer requests (for supervisor panel)
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')
    return proxyToBackend(request, `/api/v1/whatsapp/transfer-requests/pending?tenantId=${tenantId}`)
}
