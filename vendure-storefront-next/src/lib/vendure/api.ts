import type { TadaDocumentNode } from 'gql.tada';
import { print } from 'graphql';

function env(name: string) {
    const value = process.env[name];
    const trimmed = typeof value === 'string' ? value.trim() : undefined;
    return trimmed && trimmed.length ? trimmed : undefined;
}

// Update to prefer Gateway URL
const API_GATEWAY_URL = env('API_GATEWAY_URL') || env('NEXT_PUBLIC_API_GATEWAY_URL');
const DEFAULT_VENDURE_URL = API_GATEWAY_URL ? `${API_GATEWAY_URL}/shop-api` : 'http://localhost:3006/shop-api';

const VENDURE_API_URL = env('VENDURE_SHOP_API_URL') || env('NEXT_PUBLIC_VENDURE_SHOP_API_URL') || DEFAULT_VENDURE_URL;

// Must match your Vendure Channel token (it is not always the same as the channel code/name).
const VENDURE_CHANNEL_TOKEN = env('VENDURE_CHANNEL_TOKEN') || env('NEXT_PUBLIC_VENDURE_CHANNEL_TOKEN') || '__default_channel__';
const VENDURE_AUTH_TOKEN_HEADER = env('VENDURE_AUTH_TOKEN_HEADER') || 'vendure-auth-token';
const VENDURE_AUTH_TOKEN_COOKIE = env('VENDURE_AUTH_TOKEN_COOKIE') || env('NEXT_PUBLIC_VENDURE_AUTH_TOKEN_COOKIE') || VENDURE_AUTH_TOKEN_HEADER;
const VENDURE_CHANNEL_TOKEN_HEADER = env('VENDURE_CHANNEL_TOKEN_HEADER') || 'vendure-token';

// We don't throw here anymore to allow the build to pass even if env vars are missing.
// They will still be required at runtime for the app to function correctly.

interface VendureRequestOptions {
    token?: string;
    useAuthToken?: boolean;
    channelToken?: string;
    fetch?: RequestInit;
    tags?: string[];
}

interface VendureResponse<T> {
    data?: T;
    errors?: Array<{ message: string;[key: string]: unknown }>;
}

function shouldAllowOfflineVendure() {
    // Default: allow offline in dev to avoid crashing the app shell (Navbar, etc.)
    // In production, you can opt-in via env var.
    const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build';
    return process.env.VENDURE_API_ALLOW_OFFLINE === 'true' || process.env.NODE_ENV !== 'production' || isNextBuild;
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract the Vendure auth token from response headers
 */
function extractAuthToken(headers: Headers): string | null {
    const headerToken = headers.get(VENDURE_AUTH_TOKEN_HEADER);
    if (headerToken) return headerToken;

    // Some Vendure setups may only set the cookie even when bearer tokens are enabled.
    // In browsers, this header is not readable; in Node/server environments it is.
    const setCookie = headers.get('set-cookie');
    if (!setCookie) return null;

    const match = setCookie.match(new RegExp(`${escapeRegExp(VENDURE_AUTH_TOKEN_COOKIE)}=([^;]+)`));
    return match?.[1] ? decodeURIComponent(match[1]) : null;
}


/**
 * Execute a GraphQL query against the Vendure API
 */
export async function query<TResult, TVariables>(
    document: TadaDocumentNode<TResult, TVariables>,
    ...[variables, options]: TVariables extends Record<string, never>
        ? [variables?: TVariables, options?: VendureRequestOptions]
        : [variables: TVariables, options?: VendureRequestOptions]
): Promise<{ data: TResult; token?: string }> {
    const {
        token,
        useAuthToken,
        channelToken,
        fetch: fetchOptions,
        tags,
    } = options || {};

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions?.headers as Record<string, string>),
    };

    // Use the explicitly provided token, or fetch from cookies if useAuthToken is true
    let authToken = token;
    if (useAuthToken && !authToken) {
        const { getAuthToken } = await import('@/lib/auth');
        authToken = await getAuthToken();
    }

    const isAuthedRequest = Boolean(authToken);

    if (authToken) {
        // Vendure bearer auth uses the vendure-auth-token header; some setups also accept Authorization.
        headers[VENDURE_AUTH_TOKEN_HEADER] = authToken;
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Set the channel token header (use provided channelToken or default)
    headers[VENDURE_CHANNEL_TOKEN_HEADER] = channelToken || VENDURE_CHANNEL_TOKEN;

    let response: Response;
    try {
        response = await fetch(VENDURE_API_URL!, {
            ...fetchOptions,
            method: 'POST',
            headers,
            credentials: fetchOptions?.credentials ?? 'include',
            // Never cache authenticated/customer-specific requests.
            ...(isAuthedRequest ? { cache: 'no-store' } : {}),
            body: JSON.stringify({
                query: print(document),
                variables: variables || {},
            }),
            ...(!isAuthedRequest && tags ? { next: { tags } } : {}),
        });
    } catch (e) {
        if (shouldAllowOfflineVendure()) {
            console.warn(`[Vendure API Offline Fallback] Fetch failed to ${VENDURE_API_URL}. Reason: ${(e as Error).message}`);
            return { data: {} as TResult };
        }

        throw e;
    }

    if (!response.ok) {
        if (shouldAllowOfflineVendure()) {
            console.warn(`[Vendure API Offline Fallback] HTTP ${response.status} from ${VENDURE_API_URL}. Returning empty data.`);
            return { data: {} as TResult };
        }
        const bodyText = await response.text().catch(() => '');
        const snippet = bodyText && bodyText.length > 800 ? `${bodyText.slice(0, 800)}…` : bodyText;
        throw new Error(`HTTP error! status: ${response.status}${snippet ? `; body: ${snippet}` : ''}`);
    }

    const result: VendureResponse<TResult> = await response.json();

    if (result.errors) {
        if (shouldAllowOfflineVendure()) {
            console.warn(`[Vendure API Offline Fallback] GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
            return { data: {} as TResult };
        }
        throw new Error(result.errors.map(e => e.message).join(', '));
    }

    if (!result.data) {
        if (shouldAllowOfflineVendure()) {
            console.warn('[Vendure API Offline Fallback] No data returned. Returning empty data.');
            return { data: {} as TResult };
        }
        throw new Error('No data returned from Vendure API');
    }

    const newToken = extractAuthToken(response.headers);

    return {
        data: result.data,
        ...(newToken && { token: newToken }),
    };
}

/**
 * Execute a GraphQL mutation against the Vendure API
 */
export async function mutate<TResult, TVariables>(
    document: TadaDocumentNode<TResult, TVariables>,
    ...[variables, options]: TVariables extends Record<string, never>
        ? [variables?: TVariables, options?: VendureRequestOptions]
        : [variables: TVariables, options?: VendureRequestOptions]
): Promise<{ data: TResult; token?: string }> {
    // Mutations use the same underlying implementation as queries in GraphQL
    // @ts-expect-error - Complex conditional type inference, runtime behavior is correct
    return query(document, variables, options);
}
