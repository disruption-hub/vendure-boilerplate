'use client';

import { logout } from '@/app/providers/account-data';
import { useRouter } from 'next/navigation';

export function SignOutButton() {
    const router = useRouter();

    async function handleSignOut() {
        await logout();
        router.refresh();
        router.push('/');
    }

    return (
        <button
            onClick={handleSignOut}
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
        >
            Sign out
        </button>
    );
}
