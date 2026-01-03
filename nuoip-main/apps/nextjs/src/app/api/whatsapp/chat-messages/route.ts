import { NextRequest } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
    return handleCORS()
}

export async function GET(request: NextRequest) {
    // Proxy to the backend endpoint for fetching WhatsApp messages
    // Extract contactId from query params and append to backend URL
    const { searchParams } = new URL(request.url)
    const contactId = searchParams.get('contactId')

    if (!contactId) {
        return new Response(
            JSON.stringify({ success: false, error: 'contactId is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    return proxyToBackend(request, `/api/v1/admin/whatsapp/messages?contactId=${encodeURIComponent(contactId)}`)
}

export async function POST(request: NextRequest) {
    // Proxy to the backend endpoint for sending WhatsApp messages
    return proxyToBackend(request, '/api/v1/admin/whatsapp/messages/send')
}
