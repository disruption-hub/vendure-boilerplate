import { NextRequest, NextResponse } from 'next/server'

/**
 * Mark a WhatsApp contact as read (reset unread count)
 * POST /api/whatsapp/contacts/mark-read
 */
export async function POST(request: NextRequest) {
    console.log('[Mark Read API] Request received')
    try {
        const body = await request.json()
        console.log('[Mark Read API] Request body:', JSON.stringify(body))
        const { contactId } = body

        if (!contactId) {
            console.log('[Mark Read API] Missing contactId')
            return NextResponse.json(
                { success: false, error: 'Contact ID is required' },
                { status: 400 }
            )
        }

        // Get session token from cookie or Authorization header
        let sessionToken = request.cookies.get('chat-session-token')?.value

        if (!sessionToken) {
            const authHeader = request.headers.get('authorization')
            if (authHeader?.startsWith('Bearer ')) {
                sessionToken = authHeader.substring(7)
            }
        }

        if (!sessionToken) {
            console.log('[Mark Read API] No session token found')
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        console.log('[Mark Read API] Session token found:', sessionToken.substring(0, 10) + '...')

        // Proxy request to NestJS backend
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'https://nuoip-production.up.railway.app'
        const apiUrl = `${backendUrl}/api/v1/admin/whatsapp/contacts/mark-read`

        console.log(`[Mark Read API] Forwarding to: ${apiUrl}`)
        console.log(`[Mark Read API] Request payload: ${JSON.stringify({ contactId })}`)

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({ contactId }),
        })

        console.log(`[Mark Read API] Backend response status: ${response.status}`)

        let data
        const responseText = await response.text()
        console.log(`[Mark Read API] Backend response text: ${responseText.substring(0, 500)}`)

        try {
            data = JSON.parse(responseText)
        } catch (e) {
            console.error('[Mark Read API] Failed to parse backend response:', responseText)
            return NextResponse.json(
                { success: false, error: 'Backend returned invalid JSON', details: responseText.substring(0, 100) },
                { status: response.status === 200 ? 500 : response.status }
            )
        }

        if (!response.ok) {
            console.error('[Mark Read API] Backend error:', response.status, data)
            return NextResponse.json(
                { success: false, error: data.message || 'Failed to mark contact as read' },
                { status: response.status }
            )
        }

        console.log('[Mark Read API] Success:', data)
        return NextResponse.json({ success: true, ...data })
    } catch (error) {
        console.error('[Mark as Read API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        )
    }
}
