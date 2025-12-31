'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { zkeyClient, type ZKeyUser } from '@/lib/zkey-client';
import { OIDCClient, type OIDCTokens } from '@/lib/oidc-client';
import { authenticateWithZKey } from '@/lib/vendure/auth';
import { getActiveCustomer, revalidateAuth } from '@/lib/vendure/actions';
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

    useEffect(() => {
        async function checkAuth() {
            try {
                const token = Cookies.get(TOKEN_COOKIE_NAME);
                if (token) {
                    // Try to fetch profile from Vendure first
                    const customer = await getActiveCustomer();
                    if (customer) {
                        setUser({
                            id: customer.id,
                            firstName: customer.firstName,
                            lastName: customer.lastName,
                            primaryEmail: customer.emailAddress,
                            phoneNumber: customer.phoneNumber,
                        });
                        setIsAuthenticated(true);
                    } else {
                        // Fallback to ZKey profile if not in Vendure yet
                        const profile = await OIDCClient.getUserProfile(token);
                        setUser(profile);
                        setIsAuthenticated(true);
                    }
                }
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
    }, []);

    const initiateOIDCLogin = (redirectPath?: string) => {
        OIDCClient.initiateLogin(redirectPath);
    };

    const handleOIDCCallback = async (tokens: OIDCTokens) => {
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

            // Authenticate with Vendure
            await authenticateWithZKey(tokens.access_token);

            // Force revalidation of customer data
            await revalidateAuth();

            // Fetch user profile from Vendure (master data)
            const customer = await getActiveCustomer();
            if (customer) {
                setUser({
                    id: customer.id,
                    firstName: customer.firstName,
                    lastName: customer.lastName,
                    primaryEmail: customer.emailAddress,
                    phoneNumber: customer.phoneNumber,
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
