import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
    return handleCORS()
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ticketId: string }> }
) {
    try {
        const { ticketId } = await params
        const searchParams = request.nextUrl.searchParams
        const queryString = searchParams.toString()
        const path = queryString
            ? `/api/v1/crm/tickets/${ticketId}?${queryString}`
            : `/api/v1/crm/tickets/${ticketId}`

        console.log('[CRM Ticket API] Proxying GET to backend:', path)

        const response = await proxyToBackend(request, path)

        if (!response.ok) {
            console.error('[CRM Ticket API] Backend returned error:', {
                status: response.status,
                statusText: response.statusText,
                path,
            })
        }

        return response
    } catch (error) {
        console.error('[CRM Ticket API] Error proxying to backend:', error)
        return NextResponse.json(
            { error: 'Failed to load ticket', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ ticketId: string }> }
) {
    try {
        const { ticketId } = await params
        const body = await request.json().catch(() => ({}))
        const path = `/api/v1/crm/tickets/${ticketId}`

        console.log('[CRM Ticket API] Proxying PUT to backend:', path)

        return proxyToBackend(request, path, {
            method: 'PUT',
            body,
        })
    } catch (error) {
        console.error('[CRM Ticket API] Error proxying PUT to backend:', error)
        return NextResponse.json(
            { error: 'Failed to update ticket', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ ticketId: string }> }
) {
    try {
        const { ticketId } = await params
        const body = await request.json().catch(() => ({}))
        const path = `/api/v1/crm/tickets/${ticketId}`

        console.log('[CRM Ticket API] Proxying PATCH to backend:', path)

        return proxyToBackend(request, path, {
            method: 'PATCH',
            body,
        })
    } catch (error) {
        console.error('[CRM Ticket API] Error proxying PATCH to backend:', error)
        return NextResponse.json(
            { error: 'Failed to update ticket', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
