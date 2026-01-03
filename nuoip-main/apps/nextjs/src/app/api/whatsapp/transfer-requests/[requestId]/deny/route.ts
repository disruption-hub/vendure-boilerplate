import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
    return handleCORS()
}

// Deny a transfer request
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    const resolvedParams = await params
    const requestId = resolvedParams.requestId
    return proxyToBackend(request, `/api/v1/whatsapp/transfer-requests/${requestId}/deny`)
}
