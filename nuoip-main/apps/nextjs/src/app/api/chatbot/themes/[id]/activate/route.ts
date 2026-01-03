import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
    return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'https://nuoip-production.up.railway.app';
};

// POST /api/chatbot/themes/[id]/activate - Activate a theme
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const backendUrl = getBackendUrl();
        const authHeader = request.headers.get('authorization');

        const response = await fetch(`${backendUrl}/api/v1/chatbot/themes/${id}/activate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to activate theme' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API] Error activating theme:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
