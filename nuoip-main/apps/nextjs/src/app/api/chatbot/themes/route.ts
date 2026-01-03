import { NextRequest, NextResponse } from 'next/server';

const getBackendUrl = () => {
    return process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'https://nuoip-production.up.railway.app';
};

// GET /api/chatbot/themes - Get all themes
export async function GET(request: NextRequest) {
    try {
        const backendUrl = getBackendUrl();
        const authHeader = request.headers.get('authorization');

        const response = await fetch(`${backendUrl}/api/v1/chatbot/themes`, {
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch themes' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API] Error fetching themes:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/chatbot/themes - Create a new theme
export async function POST(request: NextRequest) {
    try {
        const backendUrl = getBackendUrl();
        const authHeader = request.headers.get('authorization');
        const body = await request.json();

        const response = await fetch(`${backendUrl}/api/v1/chatbot/themes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(authHeader ? { Authorization: authHeader } : {}),
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to create theme' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API] Error creating theme:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
