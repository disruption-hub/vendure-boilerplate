import { NextRequest } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
    return handleCORS()
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    const resolvedParams = await params
    const contactId = resolvedParams.contactId
    return proxyToBackend(request, `/api/v1/whatsapp/contacts/${contactId}/session/close`)
}
