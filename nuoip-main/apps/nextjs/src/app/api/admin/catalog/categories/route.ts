
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
    try {
        const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.BACKEND_URL ||
            'https://nuoip-production.up.railway.app'

        const apiUrl = `${backendUrl}/api/v1/admin/catalog/categories`

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch categories: ${response.status} ${response.statusText}` },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Categories API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.BACKEND_URL ||
            'https://nuoip-production.up.railway.app'

        const apiUrl = `${backendUrl}/api/v1/admin/catalog/categories`
        const body = await request.json()

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorText = await response.text()
            try {
                const errorJson = JSON.parse(errorText)
                return NextResponse.json(errorJson, { status: response.status })
            } catch {
                return NextResponse.json(
                    { error: errorText || `Failed to create category: ${response.status}` },
                    { status: response.status }
                )
            }
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Create category API error:', error)
        return NextResponse.json(
            { error: 'Failed to create category' },
            { status: 500 }
        )
    }
}
