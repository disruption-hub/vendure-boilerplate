'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { UserInfoResponse } from '@logto/next';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: UserInfoResponse | null;
    signIn: () => void;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    signIn: () => { },
    signOut: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<UserInfoResponse | null>(null);

    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch('/api/auth/user');
                if (res.ok) {
                    const data = await res.json();
                    setIsAuthenticated(data.isAuthenticated);
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Failed to fetch auth status', error);
            } finally {
                setIsLoading(false);
            }
        }
        checkAuth();
    }, []);

    const signIn = () => (window.location.href = '/api/auth/sign-in');
    const signOut = () => (window.location.href = '/api/auth/sign-out');

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, user, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
