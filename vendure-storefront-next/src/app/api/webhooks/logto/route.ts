import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Logto Webhook Received:', JSON.stringify(body, null, 2));

        // Future Implementation:
        // 1. Verify Logto signature using process.env.LOGTO_WEBHOOK_SECRET
        // 2. Identify event type (e.g., User.Updated)
        // 3. Call Vendure Admin API to sync changes

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Invalid Request' }, { status: 400 });
    }
}
