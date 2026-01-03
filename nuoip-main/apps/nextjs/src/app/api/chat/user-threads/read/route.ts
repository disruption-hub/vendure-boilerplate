import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
        const { peerId, messageIds } = body

        if (!peerId || !messageIds || !Array.isArray(messageIds)) {
            return NextResponse.json(
                { error: 'Missing peerId or messageIds' },
                { status: 400 }
            )
        }

        const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.BACKEND_URL ||
            'https://nuoip-production.up.railway.app'

        const response = await fetch(
            `${backendUrl}/api/v1/auth/phone/messages/read`,
            {
                method: 'POST',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ peerId, messageIds }),
            }
        )

        if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            return NextResponse.json(
                { success: false, error: errorData?.message || errorData?.error || 'Failed to mark messages as read' },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json({ success: true, ...data })
    } catch (error) {
        console.error('[User Threads Read API] Error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to mark messages as read', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
