/**
 * ZKey API Client
 * Handles authentication with the ZKey service
 */

const ZKEY_BASE_URL = process.env.NEXT_PUBLIC_ZKEY_URL || 'http://localhost:3002';

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
    avatar: string | null;
}

export class ZKeyClient {
    private baseUrl: string;

    constructor(baseUrl: string = ZKEY_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    /**
     * Register a new user
     */
    async register(email: string, firstName: string, lastName: string, phone: string, password?: string): Promise<ZKeyTokens> {
        const response = await fetch(`${this.baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, firstName, lastName, phone, password }),
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
            body: JSON.stringify({ email, password }),
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

    /**
     * Request OTP
     */
    async requestOtp(identifier: string, type: 'email' | 'phone'): Promise<{ success: boolean; message: string }> {
        const response = await fetch(`${this.baseUrl}/auth/otp/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, type }),
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
        const response = await fetch(`${this.baseUrl}/auth/wallet/nonce/${address}`);
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
