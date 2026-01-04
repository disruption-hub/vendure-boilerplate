import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3006';

export async function GET(request: Request) {
    try {
        // Extract ZKey Token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
        }

        // Extract Vendure Token
        let vendureToken = request.headers.get('vendure-auth-token');
        if (!vendureToken) {
            const cookieStore = await cookies();
            const tokenCookie = cookieStore.get('vendure-auth-token');
            if (tokenCookie) {
                vendureToken = tokenCookie.value;
            }
        }

        // Forward request to API Gateway
        const gatewayResponse = await fetch(`${API_GATEWAY_URL}/api/dashboard`, {
            headers: {
                'Authorization': authHeader,
                ...(vendureToken ? { 'vendure-auth-token': vendureToken } : {})
            }
        });

        if (!gatewayResponse.ok) {
            throw new Error(`Gateway responded with ${gatewayResponse.status}`);
        }

        const dashboardData = await gatewayResponse.json();

        return NextResponse.json(dashboardData);

    } catch (error: any) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
