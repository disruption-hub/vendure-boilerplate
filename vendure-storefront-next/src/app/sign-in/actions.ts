'use server';

import { mutate } from '@/lib/vendure/api';
import { LoginMutation, LogoutMutation } from '@/lib/vendure/mutations';
import { removeAuthToken, setAuthToken, setZKeyAuthToken } from '@/lib/auth';
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as zkey from '@/lib/zkey';
import { authenticateWithZKey } from '@/lib/vendure/auth';
import { revalidateAuth } from '@/lib/vendure/actions';

export async function loginAction(prevState: { error?: string } | undefined, formData: FormData) {
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const redirectTo = formData.get('redirectTo') as string | null;

    const result = await mutate(LoginMutation, {
        username,
        password,
    });

    const loginResult = result.data.login;

    if (loginResult.__typename !== 'CurrentUser') {
        if (loginResult.__typename === 'NotVerifiedError') {
            return { error: 'Please verify your email address before signing in.' };
        }
        return { error: 'Invalid email or password.' };
    }

    // Store the token in a cookie if returned
    if (result.token) {
        await setAuthToken(result.token);
    }

    revalidatePath('/', 'layout');

    // Validate redirectTo is a safe internal path
    const safeRedirect = redirectTo?.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : '/';

    redirect(safeRedirect);

}

export async function logoutAction() {
    await mutate(LogoutMutation);
    await removeAuthToken();

    redirect('/')
}

export async function requestOtpAction(identifier: string, type: 'email' | 'phone') {
    return zkey.requestOtp(identifier, type);
}

export async function verifyOtpAction(identifier: string, code: string) {
    try {
        const res = await zkey.verifyOtp(identifier, code);
        if (res.accessToken) {
            await setZKeyAuthToken(res.accessToken);
            // Establish a Vendure customer session and create/sync the Customer via the ZKey auth strategy.
            await authenticateWithZKey(res.accessToken);
            await revalidateAuth();
            revalidatePath('/', 'layout');
            return { success: true };
        }
        return { success: false, error: 'Verification failed' };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Verification failed' };
    }
}

export async function getWalletNonceAction(address: string) {
    return zkey.getWalletNonce(address);
}

export async function loginWithWalletAction(address: string, signature: string) {
    try {
        const res = await zkey.loginWithWallet(address, signature);
        if (res.accessToken) {
            await setZKeyAuthToken(res.accessToken);
            await authenticateWithZKey(res.accessToken);
            await revalidateAuth();
            revalidatePath('/', 'layout');
            return { success: true };
        }
        return { success: false, error: 'Login failed' };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Login failed' };
    }
}
