const ZKEY_SERVICE_URL = process.env.NEXT_PUBLIC_ZKEY_URL || 'http://localhost:3002';
const CLIENT_ID = process.env.NEXT_PUBLIC_ZKEY_CLIENT_ID || 'default-client-id';
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` : 'http://localhost:3001/auth/callback';

export interface OIDCTokens {
    access_token: string;
    refresh_token: string;
    id_token: string;
    token_type: string;
    expires_in: number;
}

export class OIDCClient {
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
            redirect_uri: REDIRECT_URI,
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
                redirect_uri: REDIRECT_URI,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Token exchange failed: ${error}`);
        }

        const tokens = await response.json();

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
            throw new Error('Token refresh failed');
        }

        return response.json();
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
