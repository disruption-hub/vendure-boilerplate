import { cookies } from 'next/headers';

const AUTH_TOKEN_COOKIE = process.env.VENDURE_AUTH_TOKEN_COOKIE || 'vendure-auth-token';

export async function setAuthToken(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_TOKEN_COOKIE, token);
}

import { logtoConfig } from './auth-config';
import LogtoClient from '@logto/next/edge';

const client = new LogtoClient(logtoConfig);

export async function getAuthToken(): Promise<string | undefined> {
    try {
        const { accessToken } = await client.getLogtoContext(undefined as any); // Use request context appropriately if available
        if (accessToken) {
            return accessToken;
        }
    } catch (e) {
        // Logto context likely unavailable or not authenticated
    }

    const cookieStore = await cookies();
    return cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
}

export async function removeAuthToken() {
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_TOKEN_COOKIE);
}
