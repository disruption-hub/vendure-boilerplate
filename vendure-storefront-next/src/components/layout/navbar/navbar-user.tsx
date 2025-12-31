'use client';

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";

export function NavbarUser() {
    const { isAuthenticated, user, signOut, isLoading, initiateOIDCLogin } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || isLoading) {
        return (
            <Button variant="ghost" disabled>
                <User className="h-5 w-5 animate-pulse" />
            </Button>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <Button variant="ghost" onClick={() => initiateOIDCLogin()}>
                Sign In
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                    <User className="h-5 w-5 mr-2" />
                    {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.primaryEmail || 'Account'}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href="/account/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/account/orders">Orders</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
