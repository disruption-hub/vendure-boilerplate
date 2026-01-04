const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3004';
const ZKEY_SERVICE_URL = process.env.NEXT_PUBLIC_ZKEY_URL || 'http://localhost:3002';
const CLIENT_ID = process.env.NEXT_PUBLIC_ZKEY_CLIENT_ID || 'default-client-id';

function getRedirectUri() {
    // Prefer a stable, configured domain (e.g. https://vendure-boilerplate-vendure-storefr.vercel.app)
    // to avoid per-deploy *.vercel.app URLs breaking redirect_uri allowlists.
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    if (configured) return `${configured.replace(/\/$/, '')}/auth/callback`;

    // Fallback to current origin (useful in local dev / ad-hoc preview URLs).
    if (typeof window !== 'undefined' && window.location?.origin) {
        return `${window.location.origin}/auth/callback`;
    }

    return 'http://localhost:3001/auth/callback';
}

export interface OIDCTokens {
    access_token: string;
    refresh_token: string;
    id_token?: string;
    token_type: string;
    expires_in: number;
}

export class OIDCClient {
    private static normalizeTokens(raw: any): OIDCTokens {
        // Support both OAuth-style snake_case and service-style camelCase.
        const access_token = raw?.access_token ?? raw?.accessToken;
        const refresh_token = raw?.refresh_token ?? raw?.refreshToken;
        const token_type = raw?.token_type ?? raw?.tokenType ?? 'Bearer';
        const expires_in = raw?.expires_in ?? raw?.expiresIn ?? 3600;
        const id_token = raw?.id_token ?? raw?.idToken;

        if (typeof access_token !== 'string' || !access_token) {
            throw new Error('Token exchange failed: missing access_token');
        }
        if (typeof refresh_token !== 'string' || !refresh_token) {
            throw new Error('Token exchange failed: missing refresh_token');
        }

        return {
            access_token,
            refresh_token,
            token_type,
            expires_in,
            ...(id_token ? { id_token } : {}),
        };
    }

    /**
     * Initiates the OIDC authorization flow by redirecting to the authorization endpoint
     */
    static initiateLogin(redirectPath?: string) {
        const state = Math.random().toString(36).substring(7);
        const nonce = Math.random().toString(36).substring(7);

        // Store state and redirect path for validation after callback
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('oidc_state', state);
            sessionStorage.setItem('oidc_nonce', nonce);
            if (redirectPath) {
                sessionStorage.setItem('oidc_redirect_path', redirectPath);
            }
        }

        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            redirect_uri: getRedirectUri(),
            scope: 'openid profile email',
            response_type: 'code',
            state,
            nonce,
        });

        window.location.href = `${ZKEY_SERVICE_URL}/oauth/authorize?${params.toString()}`;
    }

    /**
     * Exchanges authorization code for tokens
     */
    static async exchangeCode(code: string, state: string): Promise<OIDCTokens> {
        // Validate state
        const storedState = sessionStorage.getItem('oidc_state');
        if (state !== storedState) {
            throw new Error('Invalid state parameter - possible CSRF attack');
        }

        const response = await fetch(`${ZKEY_SERVICE_URL}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code,
                client_id: CLIENT_ID,
                redirect_uri: getRedirectUri(),
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Token exchange failed: ${error}`);
        }

        const rawTokens = await response.json();
        const tokens = OIDCClient.normalizeTokens(rawTokens);

        if (!tokens.id_token) {
            throw new Error('Token exchange failed: missing id_token');
        }

        // Validate nonce in ID token
        const idTokenPayload = JSON.parse(atob(tokens.id_token.split('.')[1]));
        const storedNonce = sessionStorage.getItem('oidc_nonce');
        if (idTokenPayload.nonce !== storedNonce) {
            throw new Error('Invalid nonce in ID token');
        }

        // Clean up session storage
        sessionStorage.removeItem('oidc_state');
        sessionStorage.removeItem('oidc_nonce');

        return tokens;
    }

    /**
     * Gets the stored redirect path and clears it
     */
    static getAndClearRedirectPath(): string {
        const path = sessionStorage.getItem('oidc_redirect_path') || '/';
        sessionStorage.removeItem('oidc_redirect_path');
        return path;
    }

    /**
     * Refreshes the access token using the refresh token
     */
    static async refreshToken(refreshToken: string): Promise<OIDCTokens> {
        const response = await fetch(`${ZKEY_SERVICE_URL}/oauth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: CLIENT_ID,
            }),
        });

        if (!response.ok) {
            const error = await response.text().catch(() => '');
            throw new Error(`Token refresh failed: ${error || response.status}`);
        }

        const rawTokens = await response.json();
        return OIDCClient.normalizeTokens(rawTokens);
    }

    /**
     * Gets user profile using access token
     */
    static async getUserProfile(accessToken: string) {
        const response = await fetch(`${ZKEY_SERVICE_URL}/auth/profile`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user profile');
        }

        return response.json();
    }
}
