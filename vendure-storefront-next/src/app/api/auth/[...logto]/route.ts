import { NextRequest } from 'next/server';
import LogtoClient from '@logto/next/edge';
import { logtoConfig } from '@/lib/auth-config';

const client = new LogtoClient(logtoConfig);

export async function GET(request: NextRequest, context: { params: Promise<{ logto: string[] }> }) {
    const { logto } = await context.params;
    const action = logto[0];

    console.log(`[Logto Route] Handling action: ${action} for URL: ${request.url}`);
    console.log(`[Logto Route] Using baseUrl: ${logtoConfig.baseUrl}`);

    try {
        if (action === 'sign-in') {
            return client.handleSignIn(`${logtoConfig.baseUrl}/api/auth/callback`)(request);
        }
        if (action === 'sign-up') {
            return client.handleSignIn({
                redirectUri: `${logtoConfig.baseUrl}/api/auth/callback`,
                interactionMode: 'signUp',
            })(request);
        }
        if (action === 'callback') {
            return client.handleSignInCallback(`${logtoConfig.baseUrl}`)(request);
        }
        if (action === 'sign-out') {
            return client.handleSignOut(`${logtoConfig.baseUrl}`)(request);
        }
        if (action === 'user') {
            return client.handleUser()(request);
        }
    } catch (error: any) {
        console.error(`[Logto Route] Error handling action ${action}:`, error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }), {
            status: 500,
            headers: { 'content-type': 'application/json' }
        });
    }

    return new Response(null, { status: 404 });
}

export const POST = GET;
