'use client'

import { ComponentProps, useTransition } from "react";
import { logoutAction } from "@/app/sign-in/actions";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface LoginButtonProps extends ComponentProps<'button'> {
    isLoggedIn: boolean;
}

export function LoginButton({ isLoggedIn, ...props }: LoginButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    return (
        <button {...props} aria-disabled={isPending}
            onClick={() => {
                if (isLoggedIn) {
                    startTransition(async () => {
                        await logoutAction()
                    })
                } else {
                    const current = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ''}`;
                    router.push(`/sign-in?redirect=${encodeURIComponent(current)}`);
                }
            }}>
            {isLoggedIn ? 'Sign out' : 'Sign in'}
        </button>
    )
}