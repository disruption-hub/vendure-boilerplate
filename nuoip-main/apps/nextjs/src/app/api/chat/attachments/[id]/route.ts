import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Proxy to backend instead of direct DB access
        const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
        const response = await fetch(`${backendUrl}/api/v1/chat/attachments/${id}`, {
            method: 'GET',
            headers: {
                // Forward authorization if present
                ...(request.headers.get('authorization')
                    ? { 'authorization': request.headers.get('authorization')! }
                    : {}
                ),
            },
        })

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json(
                    { error: 'Attachment not found' },
                    { status: 404 }
                )
            }
            throw new Error(`Backend returned ${response.status}`)
        }

        // Get the binary data and content type from backend
        const buffer = await response.arrayBuffer()
        const contentType = response.headers.get('content-type') || 'application/octet-stream'
        const contentDisposition = response.headers.get('content-disposition') || 'inline'

        // Return the file with appropriate headers
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': contentDisposition,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch (error) {
        console.error('[Attachment API] Error:', error)
        return NextResponse.json(
            { error: 'Failed to retrieve attachment' },
            { status: 500 }
        )
    }
}
