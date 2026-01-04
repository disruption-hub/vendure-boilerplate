'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { OIDCClient, type OIDCTokens } from '@/lib/oidc-client';
import Cookies from 'js-cookie';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: any | null; // Changed from ZKeyUser to any to accommodate Vendure Customer
    login: (email: string, password: string) => Promise<void>;
    loginWithOtp: (identifier: string, code: string) => Promise<void>;
    loginWithWallet: (address: string, signature: string) => Promise<void>;
    register: (email: string, firstName: string, lastName: string, phone: string, password?: string) => Promise<void>;
    signOut: () => void;
    initiateOIDCLogin: (redirectPath?: string) => void;
    handleOIDCCallback: (tokens: OIDCTokens) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    login: async () => { },
    loginWithOtp: async () => { },
    loginWithWallet: async () => { },
    register: async () => { },
    signOut: () => { },
    initiateOIDCLogin: () => { },
    handleOIDCCallback: async () => { },
});

const TOKEN_COOKIE_NAME = 'zkey_token';
const REFRESH_TOKEN_COOKIE_NAME = 'zkey_refresh_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<any | null>(null);

    const handleOIDCCallback = useCallback(async (tokens: OIDCTokens) => {
        try {
            // Store tokens in cookies
            Cookies.set(TOKEN_COOKIE_NAME, tokens.access_token, {
                expires: tokens.expires_in / 86400, // Convert seconds to days
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            });

            Cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refresh_token, {
                expires: 7, // 7 days
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
            });

            // Establish a Vendure session on this domain (sets httpOnly vendure-auth-token cookie)
            const vendureAuthRes = await fetch('/api/auth/vendure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: tokens.access_token }),
            });
            if (!vendureAuthRes.ok) {
                const text = await vendureAuthRes.text().catch(() => '');
                throw new Error(`Vendure auth failed (${vendureAuthRes.status}): ${text || 'unknown error'}`);
            }

            // Fetch user profile from Vendure (master data)
            const customerRes = await fetch('/api/auth/customer', { cache: 'no-store' });
            const customerJson = await customerRes.json().catch(() => null);
            const customer = customerRes.ok ? customerJson?.customer : null;

            const zkeyProfile = await OIDCClient.getUserProfile(tokens.access_token);
            const userRoles = zkeyProfile.roles || ['standard'];

            if (customer) {
                setUser({
                    id: customer.id,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    primaryEmail: customer.emailAddress,
                    phoneNumber: customer.phoneNumber,
                    roles: userRoles,
                });
            } else {
                // Fallback to ZKey profile
                const profile = await OIDCClient.getUserProfile(tokens.access_token);
                setUser(profile);
            }
            setIsAuthenticated(true);
        } catch (error) {
            console.error('OIDC callback handling failed:', error);
            throw error;
        }
    }, []);

    useEffect(() => {
        async function checkAuth() {
            try {
                // Prefer Vendure session (httpOnly cookie) regardless of client-side ZKey cookie.
                try {
                    const customerRes = await fetch('/api/auth/customer', { cache: 'no-store' });
                    const customerJson = await customerRes.json().catch(() => null);
                    const customer = customerRes.ok ? customerJson?.customer : null;

                    const token = Cookies.get(TOKEN_COOKIE_NAME);
                    let userRoles = ['standard'];
                    if (token) {
                        const zkeyProfile = await OIDCClient.getUserProfile(token);
                        userRoles = zkeyProfile.roles || [zkeyProfile.role] || ['standard'];
                    }

                    if (customer) {
                        setUser({
                            id: customer.id,
                            firstName: customer.firstName,
                            lastName: customer.lastName,
                            primaryEmail: customer.emailAddress,
                            phoneNumber: customer.phoneNumber,
                            roles: userRoles,
                        });
                        setIsAuthenticated(true);
                        return;
                    }
                } catch {
                    // Ignore and fall back to ZKey token/profile.
                }

                const token = Cookies.get(TOKEN_COOKIE_NAME);
                if (!token) return;

                // Fallback to ZKey profile if no Vendure customer is available yet.
                const profile = await OIDCClient.getUserProfile(token);
                setUser(profile);
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Failed to fetch auth status', error);

                // Try to refresh token
                const refreshToken = Cookies.get(REFRESH_TOKEN_COOKIE_NAME);
                if (refreshToken) {
                    try {
                        const tokens = await OIDCClient.refreshToken(refreshToken);
                        await handleOIDCCallback(tokens);
                    } catch (refreshError) {
                        console.error('Token refresh failed', refreshError);
                        Cookies.remove(TOKEN_COOKIE_NAME);
                        Cookies.remove(REFRESH_TOKEN_COOKIE_NAME);
                    }
                } else {
                    Cookies.remove(TOKEN_COOKIE_NAME);
                }
            } finally {
                setIsLoading(false);
            }
        }
        checkAuth();
    }, [handleOIDCCallback]);

    const initiateOIDCLogin = (redirectPath?: string) => {
        OIDCClient.initiateLogin(redirectPath);
    };

    // Legacy methods - kept for backward compatibility but now redirect to OIDC
    const login = async (email: string, password: string) => {
        // For now, redirect to OIDC flow
        // In a real implementation, you might want to show a message
        initiateOIDCLogin();
    };

    const register = async (email: string, firstName: string, lastName: string, phone: string, password?: string) => {
        // For now, redirect to OIDC flow
        initiateOIDCLogin();
    };

    const loginWithOtp = async (identifier: string, code: string) => {
        // For now, redirect to OIDC flow
        initiateOIDCLogin();
    };

    const loginWithWallet = async (address: string, signature: string) => {
        // For now, redirect to OIDC flow
        initiateOIDCLogin();
    };

    const signOut = () => {
        // Clear server-side session cookies (Vendure httpOnly auth cookie)
        fetch('/api/auth/sign-out', { method: 'POST' }).catch(() => {
            // ignore
        });

        Cookies.remove(TOKEN_COOKIE_NAME);
        Cookies.remove(REFRESH_TOKEN_COOKIE_NAME);
        setUser(null);
        setIsAuthenticated(false);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            isLoading,
            user,
            login,
            loginWithOtp,
            loginWithWallet,
            register,
            signOut,
            initiateOIDCLogin,
            handleOIDCCallback,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
