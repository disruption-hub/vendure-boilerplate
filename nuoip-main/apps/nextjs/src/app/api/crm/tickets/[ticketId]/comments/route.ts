import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
    return handleCORS()
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ ticketId: string }> }
) {
    try {
        const { ticketId } = await params
        const body = await request.json().catch(() => ({}))
        const path = `/api/v1/crm/tickets/${ticketId}/comments`

        console.log('[CRM Ticket Comments API] Proxying POST to backend:', path)

        return proxyToBackend(request, path, {
            method: 'POST',
            body,
        })
    } catch (error) {
        console.error('[CRM Ticket Comments API] Error proxying to backend:', error)
        return NextResponse.json(
            { error: 'Failed to add comment', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
