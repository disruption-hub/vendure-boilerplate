import { NextRequest, NextResponse } from 'next/server'
import { proxyToBackend, handleCORS } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function OPTIONS() {
    return handleCORS()
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}))
        const authHeader = request.headers.get('authorization')

        console.log('[CRM Create Customer API] Request received', {
            name: body.name,
            hasPhone: !!body.phone,
            hasEmail: !!body.email,
            hasTenantId: !!body.tenantId,
            hasAuth: !!authHeader,
        })

        // Validate required fields
        if (!body.tenantId) {
            return NextResponse.json(
                { success: false, error: 'Missing tenantId' },
                { status: 400 }
            )
        }

        if (!body.name) {
            return NextResponse.json(
                { success: false, error: 'Missing name' },
                { status: 400 }
            )
        }

        // Proxy to backend CRM create customer endpoint
        const response = await proxyToBackend(request, '/api/v1/crm/customers/create', {
            method: 'POST',
            body: {
                tenantId: body.tenantId,
                name: body.name,
                email: body.email || null,
                phone: body.phone || null,
                sessionId: body.sessionId || null,
            },
            headers: authHeader ? { 'Authorization': authHeader } : {},
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            console.error('[CRM Create Customer API] Backend error', {
                status: response.status,
                error: errorData,
            })
            return NextResponse.json(
                { success: false, error: errorData.message || 'Failed to create customer' },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json({ success: true, customer: data.customer || data })
    } catch (error) {
        console.error('[CRM Create Customer API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to create customer', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
