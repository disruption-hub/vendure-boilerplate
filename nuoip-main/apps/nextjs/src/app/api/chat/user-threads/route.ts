import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const peerId = request.nextUrl.searchParams.get('peerId')
        const authHeader = request.headers.get('authorization')

        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized: No token provided' },
                { status: 401 }
            )
        }

        if (!peerId) {
            return NextResponse.json(
                { error: 'Missing peerId parameter' },
                { status: 400 }
            )
        }

        const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.BACKEND_URL ||
            'https://nuoip-production.up.railway.app'

        const response = await fetch(
            `${backendUrl}/api/v1/auth/phone/messages?peerId=${encodeURIComponent(peerId)}`,
            {
                headers: {
                    'Authorization': authHeader,
                },
            }
        )

        if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            return NextResponse.json(
                { error: errorData?.message || errorData?.error || 'Failed to load messages' },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('[User Threads API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to load user thread', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')

        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized: No token provided' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { recipientId, content, attachments } = body

        if (!recipientId || !content) {
            return NextResponse.json(
                { error: 'Missing recipientId or content' },
                { status: 400 }
            )
        }

        const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.BACKEND_URL ||
            'https://nuoip-production.up.railway.app'

        const response = await fetch(
            `${backendUrl}/api/v1/auth/phone/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ recipientId, content, attachments }),
            }
        )

        if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            return NextResponse.json(
                { error: errorData?.message || errorData?.error || 'Failed to send message' },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('[User Threads Send API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to send message', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
