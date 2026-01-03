import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
    return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'https://nuoip-production.up.railway.app';
};

// GET /api/chatbot/themes/active - Get the active theme
export async function GET(request: NextRequest) {
    try {
        const backendUrl = getBackendUrl();
        const authHeader = request.headers.get('authorization');

        const response = await fetch(`${backendUrl}/api/v1/chatbot/themes/active`, {
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
        });

        if (!response.ok) {
            // Return empty if no active theme found
            if (response.status === 404) {
                return NextResponse.json(null);
            }
            return NextResponse.json(
                { error: 'Failed to fetch active theme' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API] Error fetching active theme:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
