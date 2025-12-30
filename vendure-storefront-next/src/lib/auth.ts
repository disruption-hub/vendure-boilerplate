import { cookies } from 'next/headers';

const AUTH_TOKEN_COOKIE = process.env.VENDURE_AUTH_TOKEN_COOKIE || 'vendure-auth-token';

export async function setAuthToken(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_TOKEN_COOKIE, token);
}

import { getLogtoContext } from '@logto/next/server-actions';
// import { logtoConfig } from './auth-config'; // Circular dep risk? No, auth-config is simple.
// Wait, I can't import logtoConfig if it's not exported or if path is wrong.
// I'll check imports.

export async function getAuthToken(): Promise<string | undefined> {
    try {
        const { logtoConfig } = await import('@/lib/auth-config');
        const { accessToken } = await getLogtoContext(logtoConfig);
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
