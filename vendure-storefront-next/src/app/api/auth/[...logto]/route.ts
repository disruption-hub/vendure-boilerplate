import { NextRequest } from 'next/server';
import LogtoClient from '@logto/next/edge';
import { logtoConfig } from '@/lib/auth-config';

const client = new LogtoClient(logtoConfig);

export async function GET(request: NextRequest, context: { params: Promise<{ logto: string[] }> }) {
    const { logto } = await context.params;
    const action = logto[0];

    if (action === 'sign-in') {
        return client.handleSignIn(`${logtoConfig.baseUrl}/callback`)(request);
    }
    if (action === 'sign-up') {
        return client.handleSignIn({
            redirectUri: `${logtoConfig.baseUrl}/callback`,
            interactionMode: 'signUp',
        })(request);
    }
    if (action === 'callback') {
        return client.handleSignInCallback(`${logtoConfig.baseUrl}`)(request);
    }
    if (action === 'sign-out') {
        return client.handleSignOut(`${logtoConfig.baseUrl}`)(request);
    }

    return new Response(null, { status: 404 });
}

export const POST = GET;
