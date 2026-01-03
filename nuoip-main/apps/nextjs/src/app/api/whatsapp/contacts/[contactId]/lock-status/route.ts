import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
    return handleCORS()
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    const resolvedParams = await params
    const contactId = resolvedParams.contactId
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    return proxyToBackend(request, `/api/v1/whatsapp/contacts/${contactId}/lock-status?userId=${userId}`)
}
