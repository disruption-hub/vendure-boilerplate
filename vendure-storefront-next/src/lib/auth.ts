import { cookies } from 'next/headers';
import { cache } from 'react';

const ZKEY_TOKEN_COOKIE = 'zkey_token';
const VENDURE_AUTH_TOKEN_COOKIE = process.env.VENDURE_AUTH_TOKEN_COOKIE || 'vendure-auth-token';

// Use React.cache to share the token within the same request lifecycle
// (Since cookies().set() is not always visible to cookies().get() in the same request)
const getRequestCache = cache(() => ({
    token: undefined as string | undefined
}));

export async function setAuthToken(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(VENDURE_AUTH_TOKEN_COOKIE, token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });

    // Also update the request cache
    getRequestCache().token = token;
}

export async function setZKeyAuthToken(token: string) {
    const cookieStore = await cookies();
    cookieStore.set(ZKEY_TOKEN_COOKIE, token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });
}

export async function getAuthToken(): Promise<string | undefined> {
    // Check request cache first
    const cachedToken = getRequestCache().token;
    if (cachedToken) {
        return cachedToken;
    }

    const cookieStore = await cookies();

    // Prioritize Vendure's own auth token as it's required for Shop API calls
    const vendureToken = cookieStore.get(VENDURE_AUTH_TOKEN_COOKIE)?.value;
    if (vendureToken) {
        return vendureToken;
    }

    // Fallback to ZKey token if needed, though typically not used for Shop API
    return cookieStore.get(ZKEY_TOKEN_COOKIE)?.value;
}

export async function removeAuthToken() {
    const cookieStore = await cookies();
    cookieStore.delete(ZKEY_TOKEN_COOKIE);
    cookieStore.delete(VENDURE_AUTH_TOKEN_COOKIE);
    getRequestCache().token = undefined;
}
