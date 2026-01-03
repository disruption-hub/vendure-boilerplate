import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
    return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'https://nuoip-production.up.railway.app';
};

// PATCH /api/chatbot/themes/[id] - Update a theme
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const backendUrl = getBackendUrl();
        const authHeader = request.headers.get('authorization');
        const body = await request.json();

        const response = await fetch(`${backendUrl}/api/v1/chatbot/themes/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to update theme' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API] Error updating theme:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/chatbot/themes/[id] - Delete a theme
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const backendUrl = getBackendUrl();
        const authHeader = request.headers.get('authorization');

        const response = await fetch(`${backendUrl}/api/v1/chatbot/themes/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to delete theme' },
                { status: response.status }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Error deleting theme:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
