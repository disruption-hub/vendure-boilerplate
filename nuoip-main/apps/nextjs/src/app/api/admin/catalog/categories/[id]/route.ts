
import { NextRequest, NextResponse } from 'next/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.BACKEND_URL ||
            'https://nuoip-production.up.railway.app'

        const apiUrl = `${backendUrl}/api/v1/admin/catalog/categories/${id}`

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        })

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json(
                    { error: 'Category not found' },
                    { status: 404 }
                )
            }
            return NextResponse.json(
                { error: `Failed to fetch category: ${response.status}` },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Get category API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch category' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.BACKEND_URL ||
            'https://nuoip-production.up.railway.app'

        const apiUrl = `${backendUrl}/api/v1/admin/catalog/categories/${id}`
        const body = await request.json()

        // Note: Backend might use PUT, but we use PATCH here. 
        // We are proxying, so we should try to match what backend expects if possible, 
        // or rely on backend accepting PATCH. 
        // Only 'PUT' was seen in backend controller earlier. 
        // Converting PATCH to PUT to be safe with existing Backend Controller '@Put' decorator.
        const response = await fetch(apiUrl, {
            method: 'PUT',
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
                    { error: errorText || `Failed to update category: ${response.status}` },
                    { status: response.status }
                )
            }
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Update category API error:', error)
        return NextResponse.json(
            { error: 'Failed to update category' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const backendUrl =
            process.env.NEXT_PUBLIC_BACKEND_URL ||
            process.env.BACKEND_URL ||
            'https://nuoip-production.up.railway.app'

        const apiUrl = `${backendUrl}/api/v1/admin/catalog/categories/${id}`

        const response = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                'Authorization': request.headers.get('Authorization') || '',
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            return NextResponse.json(
                { error: errorText || `Failed to delete category: ${response.status}` },
                { status: response.status }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Delete category API error:', error)
        return NextResponse.json(
            { error: 'Failed to delete category' },
            { status: 500 }
        )
    }
}
