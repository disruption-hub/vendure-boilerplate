export type VendureAdminConfig = {
    adminApiUrl?: string; // Legacy / Fallback
    adminApiUrlDev?: string;
    adminApiUrlProd?: string;
    authTokenHeader?: string;
    adminApiToken?: string;
    superadminUsername?: string;
    superadminPassword?: string;
};

const DEFAULT_ADMIN_API_URL = 'http://localhost:3000/admin-api';
const DEFAULT_AUTH_TOKEN_HEADER = 'vendure-auth-token';

const tokenCache = new Map<string, string>();

type GraphqlResponse<T> = { data?: T; errors?: Array<{ message: string }> };

function normalizeUrl(url: string) {
    return url.trim().replace(/\/+$/, '');
}

function getAuthHeaderName(config?: VendureAdminConfig) {
    return (config?.authTokenHeader || process.env.VENDURE_AUTH_TOKEN_HEADER || DEFAULT_AUTH_TOKEN_HEADER).trim();
}

function getAdminApiUrl(config?: VendureAdminConfig) {
    const env = process.env.NODE_ENV || "development";

    // 1. Check for environment-specific URL first
    let rawUrl = env === "production" ? config?.adminApiUrlProd : config?.adminApiUrlDev;

    // 2. Fallback to the generic adminApiUrl if specific one is missing
    if (!rawUrl) {
        rawUrl = config?.adminApiUrl || process.env.VENDURE_ADMIN_API_URL;
    }

    if (rawUrl) {
        return normalizeUrl(rawUrl);
    }

    // 3. Last resort - environment-specific default or empty for production validation
    if (env === "production") {
        return "";
    }

    return normalizeUrl(DEFAULT_ADMIN_API_URL);
}

function isValidAdminApiUrl(url: string) {
    if (!url) return false;
    // Basic check for protocol and host
    try {
        const u = new URL(url);
        if (process.env.NODE_ENV === 'production' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
            return false;
        }
        return true;
    } catch {
        return false;
    }
}

function cacheKey(config?: VendureAdminConfig) {
    const url = getAdminApiUrl(config);
    const header = getAuthHeaderName(config);
    const username = (config?.superadminUsername || process.env.VENDURE_SUPERADMIN_USERNAME || '').trim();
    return `${url}|${header}|${username}`;
}

async function vendureAdminRequest<T>(
    query: string,
    variables?: Record<string, unknown>,
    config?: VendureAdminConfig,
): Promise<{ data: T; token?: string }> {
    const adminApiUrl = getAdminApiUrl(config);
    if (!isValidAdminApiUrl(adminApiUrl)) {
        throw new Error(`Skipping Vendure admin request: Invalid or localhost API URL in production: ${adminApiUrl}`);
    }

    const token = await getVendureAdminToken(config);
    const authHeader = getAuthHeaderName(config);

    const body = JSON.stringify({ query, variables: variables ?? {} });

    const response = await fetch(adminApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            [authHeader]: token,
            Authorization: `Bearer ${token}`,
        },
        body,
    });

    if (!response.ok) {
        throw new Error(`Vendure admin API HTTP ${response.status} (${response.statusText})`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        let errorMsg = `Vendure admin API returned non-JSON response (${contentType})`;
        if (text.includes('<base href="/admin/"') || text.includes('Vendure Admin UI')) {
            errorMsg += '. You are likely pointing to the Vendure Admin UI URL (e.g. .../admin) instead of the Admin API URL (e.g. .../admin-api). Please check your Vendure Admin API URL setting.';
        } else {
            errorMsg += `: ${text.slice(0, 200)}...`;
        }
        throw new Error(errorMsg);
    }

    const json = (await response.json()) as GraphqlResponse<T>;
    if (json.errors?.length) {
        throw new Error(json.errors.map(e => e.message).join(', '));
    }
    if (!json.data) {
        throw new Error('Vendure admin API returned no data');
    }

    const newToken = response.headers.get(authHeader) || undefined;
    if (newToken) tokenCache.set(cacheKey(config), newToken);

    return { data: json.data, token: newToken };
}

async function getVendureAdminToken(config?: VendureAdminConfig): Promise<string> {
    const staticToken = (config?.adminApiToken || process.env.VENDURE_ADMIN_API_TOKEN || '').trim();
    if (staticToken) return staticToken;

    const cached = tokenCache.get(cacheKey(config));
    if (cached) return cached;

    const username = (config?.superadminUsername || process.env.VENDURE_SUPERADMIN_USERNAME || '').trim();
    const password = (config?.superadminPassword || process.env.VENDURE_SUPERADMIN_PASSWORD || '').trim();
    if (!username || !password) {
        throw new Error(
            'Missing Vendure admin auth: set Vendure credentials on the Application (Providers tab) or via env: VENDURE_ADMIN_API_TOKEN or (VENDURE_SUPERADMIN_USERNAME + VENDURE_SUPERADMIN_PASSWORD)',
        );
    }

    const loginMutation = `#graphql
        mutation Login($username: String!, $password: String!) {
            login(username: $username, password: $password) {
                __typename
                ... on CurrentUser {
                    id
                }
                ... on ErrorResult {
                    message
                }
            }
        }
    `;

    const adminApiUrl = getAdminApiUrl(config);
    if (!isValidAdminApiUrl(adminApiUrl)) {
        throw new Error(`Skipping Vendure admin login: Invalid or localhost API URL in production: ${adminApiUrl}`);
    }

    const authHeader = getAuthHeaderName(config);

    const response = await fetch(adminApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: loginMutation,
            variables: { username, password },
        }),
    });

    if (!response.ok) {
        throw new Error(`Vendure admin login failed: HTTP ${response.status} (${response.statusText})`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Vendure admin login returned non-JSON response (${contentType}): ${text.slice(0, 200)}...`);
    }

    const json = (await response.json()) as GraphqlResponse<{ login: { __typename: string; message?: string } }>;
    if (json.errors?.length) {
        throw new Error(json.errors.map(e => e.message).join(', '));
    }

    if (json.data?.login?.__typename === 'ErrorResult') {
        throw new Error(json.data.login.message || 'Vendure admin login failed');
    }

    const token = response.headers.get(authHeader);
    if (!token) {
        throw new Error(`Vendure admin login succeeded but no ${authHeader} header was returned`);
    }
    tokenCache.set(cacheKey(config), token);
    return token;
}

export async function syncZKeyUserInVendure(input: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    phoneNumber?: string | null;
    walletAddress?: string | null;
}, config?: VendureAdminConfig) {
    const mutation = `#graphql
        mutation SyncZKeyUser($input: SyncZKeyUserInput!) {
            syncZKeyUser(input: $input) {
                id
                emailAddress
            }
        }
    `;

    return vendureAdminRequest<{ syncZKeyUser: { id: string; emailAddress: string } }>(
        mutation,
        {
            input: {
                id: input.id,
                email: input.email,
                firstName: input.firstName === undefined ? undefined : input.firstName,
                lastName: input.lastName === undefined ? undefined : input.lastName,
                phoneNumber: input.phoneNumber === undefined ? undefined : input.phoneNumber,
                walletAddress: input.walletAddress === undefined ? undefined : input.walletAddress,
            },
        },
        config,
    );
}

export async function deleteZKeyUserInVendure(id: string, email: string, config?: VendureAdminConfig) {
    const mutation = `#graphql
        mutation DeleteZKeyUser($id: String!, $email: String) {
            deleteZKeyUser(id: $id, email: $email)
        }
    `;

    return vendureAdminRequest<{ deleteZKeyUser: boolean }>(mutation, { id, email }, config);
}
