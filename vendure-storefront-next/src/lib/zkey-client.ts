/**
 * ZKey API Client
 * Handles authentication with the ZKey service
 */

const ZKEY_BASE_URL = process.env.NEXT_PUBLIC_ZKEY_URL || 'http://localhost:3002';
const ZKEY_CLIENT_ID = process.env.NEXT_PUBLIC_ZKEY_CLIENT_ID;

export interface ZKeyTokens {
    accessToken: string;
    refreshToken: string;
}

export interface ZKeyUser {
    id: string;
    firstName: string | null;
    lastName: string | null;
    primaryEmail: string | null;
    emailVerified: boolean;
    phoneNumber: string | null;
    phoneVerified: boolean;
    walletAddress?: string | null;
    avatar: string | null;
}

export class ZKeyClient {
    private baseUrl: string;

    constructor(baseUrl: string = ZKEY_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    private getClientId() {
        if (!ZKEY_CLIENT_ID) {
            throw new Error('NEXT_PUBLIC_ZKEY_CLIENT_ID is required');
        }
        return ZKEY_CLIENT_ID;
    }

    /**
     * Register a new user
     */
    async register(email: string, firstName: string, lastName: string, phone: string, password?: string): Promise<ZKeyTokens> {
        const response = await fetch(`${this.baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, firstName, lastName, phone, password, clientId: this.getClientId() }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Registration failed: ${error}`);
        }

        return response.json();
    }

    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<ZKeyTokens> {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, clientId: this.getClientId() }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Login failed: ${error}`);
        }

        return response.json();
    }

    /**
     * Get user profile using access token
     */
    async getProfile(token: string): Promise<ZKeyUser> {
        const response = await fetch(`${this.baseUrl}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        return response.json();
    }

    async unlinkWallet(token: string): Promise<{ success: boolean }> {
        const response = await fetch(`${this.baseUrl}/auth/wallet/unlink`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error((data as any)?.message || 'Failed to unlink wallet');
        }

        return response.json();
    }

    /**
     * Request OTP
     */
    async requestOtp(identifier: string, type: 'email' | 'phone'): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${this.baseUrl}/auth/otp/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, type, clientId: this.getClientId() }),
        });
        return response.json();
    }

    /**
     * Verify OTP
     */
    async verifyOtp(identifier: string, code: string): Promise<ZKeyTokens> {
        const response = await fetch(`${this.baseUrl}/auth/otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, code }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Verification failed');
        }

        return response.json();
    }

    /**
     * Get Wallet Nonce
     */
    async getWalletNonce(address: string): Promise<{ nonce: string }> {
        const response = await fetch(`${this.baseUrl}/auth/nonce/${address}`);
        if (!response.ok) throw new Error('Failed to get nonce');
        return response.json();
    }

    /**
     * Login with Wallet
     */
    async loginWithWallet(address: string, signature: string): Promise<ZKeyTokens> {
        const response = await fetch(`${this.baseUrl}/auth/wallet/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, signature }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Wallet login failed');
        }

        return response.json();
    }
}

// Export singleton instance
export const zkeyClient = new ZKeyClient();
