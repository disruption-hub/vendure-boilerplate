import Cookies from 'js-cookie';

const ZKEY_TOKEN_COOKIE = 'zkey_token';

/**
 * Client-side utility to get the ZKey authentication token.
 * This is safe to use in 'use client' components.
 */
export function getZKeyAuthToken(): string | undefined {
    return Cookies.get(ZKEY_TOKEN_COOKIE);
}
