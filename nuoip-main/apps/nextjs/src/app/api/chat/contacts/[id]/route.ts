import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
    return handleCORS()
}

/**
 * PUT /api/chat/contacts/[id]
 * Updates a contact's details (name, email, phone, description)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params
        const contactId = id
        const authHeader = request.headers.get('authorization')

        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized: No token provided' },
                { status: 401 }
            )
        }

        // Extract token from Authorization header
        const token = authHeader.replace(/^Bearer\s+/i, '')

        // Parse the request body
        const body = await request.json()
        const { tenantId, displayName, phone, email, description } = body

        if (!tenantId) {
            return NextResponse.json(
                { error: 'Missing tenantId in request body' },
                { status: 400 }
            )
        }

        if (!contactId) {
            return NextResponse.json(
                { error: 'Missing contactId in URL' },
                { status: 400 }
            )
        }

        console.log('[Chat Contact Update API] Updating contact', {
            contactId,
            tenantId,
            hasDisplayName: !!displayName,
            hasPhone: !!phone,
            hasEmail: !!email,
            hasDescription: !!description,
        })

        // Call backend endpoint
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.BACKEND_URL ||
            'https://nuoip-production.up.railway.app'
        const normalizedBackendUrl = backendUrl.replace(/\/+$/, '')

        const response = await fetch(
            `${normalizedBackendUrl}/api/v1/admin/tenants/${encodeURIComponent(tenantId)}/contacts/${encodeURIComponent(contactId)}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader,
                },
                body: JSON.stringify({
                    displayName,
                    phone,
                    email,
                    description,
                }),
            }
        )

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error')
            console.error('[Chat Contact Update API] Backend returned error', {
                status: response.status,
                statusText: response.statusText,
                error: errorText.substring(0, 200),
            })
            return NextResponse.json(
                { error: 'Backend error', details: errorText },
                { status: response.status }
            )
        }

        const data = await response.json().catch(() => null)
        console.log('[Chat Contact Update API] Contact updated successfully', {
            contactId,
            success: data?.success,
        })

        return NextResponse.json(data, { status: 200 })
    } catch (error) {
        console.error('[Chat Contact Update API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to update contact', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
