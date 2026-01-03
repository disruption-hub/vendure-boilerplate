'use server';

import { mutate } from '@/lib/vendure/api';
import {
    UpdateCustomerPasswordMutation,
    UpdateCustomerMutation,
    RequestUpdateCustomerEmailAddressMutation,
} from '@/lib/vendure/mutations';
import { revalidatePath } from 'next/cache';
import { getZKeyAuthToken } from '@/lib/auth';
import * as zkey from '@/lib/zkey';
import { revalidateAuth } from '@/lib/vendure/actions';

export async function updatePasswordAction(prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: 'All fields are required' };
    }

    if (newPassword !== confirmPassword) {
        return { error: 'New passwords do not match' };
    }

    if (currentPassword === newPassword) {
        return { error: 'New password must be different from current password' };
    }

    try {
        const result = await mutate(UpdateCustomerPasswordMutation, {
            currentPassword,
            newPassword,
        }, { useAuthToken: true });

        const updateResult = result.data.updateCustomerPassword;

        if (updateResult.__typename !== 'Success') {
            return { error: updateResult.message };
        }

        return { success: true };
    } catch (error: unknown) {
        return { error: 'An unexpected error occurred. Please try again.' };
    }
}

export async function updateCustomerAction(prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const walletAddress = formData.get('walletAddress') as string;

    if (!firstName || !lastName) {
        return { error: 'First name and last name are required' };
    }

    try {
        // 1. Prepare updates
        const zkeyToken = await getZKeyAuthToken();

        const zkeyUpdatePromise = zkeyToken ? (async () => {
            console.log('[Storefront] Syncing profile and wallet update to ZKey...');
            try {
                await zkey.updateProfile(zkeyToken, {
                    firstName,
                    lastName,
                    phone: phoneNumber || undefined,
                    walletAddress: walletAddress || undefined,
                });
            } catch (zkeyError) {
                console.error('[Storefront] ZKey profile update failed:', zkeyError);
            }
        })() : Promise.resolve();

        const vendureUpdatePromise = mutate(UpdateCustomerMutation, {
            input: {
                firstName,
                lastName,
                phoneNumber: phoneNumber || null,
                customFields: {
                    walletAddress: walletAddress || null,
                }
            },
        }, { useAuthToken: true });

        // 2. Execute updates in parallel for better performance
        const [_, result] = await Promise.all([zkeyUpdatePromise, vendureUpdatePromise]);

        const updateResult = result.data.updateCustomer;

        if (!updateResult || !updateResult.id) {
            return { error: 'Failed to update customer information' };
        }

        revalidatePath('/account/profile');
        return { success: true };
    } catch (error: unknown) {
        console.error('[Storefront] Profile update failed:', error);
        return { error: 'An unexpected error occurred. Please try again.' };
    }
}

export async function requestEmailUpdateAction(prevState: { error?: string; success?: boolean } | undefined, formData: FormData) {
    const password = formData.get('password') as string;
    const newEmailAddress = formData.get('newEmailAddress') as string;

    if (!password || !newEmailAddress) {
        return { error: 'Password and new email address are required' };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmailAddress)) {
        return { error: 'Please enter a valid email address' };
    }

    try {
        const result = await mutate(RequestUpdateCustomerEmailAddressMutation, {
            password,
            newEmailAddress,
        }, { useAuthToken: true });

        const updateResult = result.data.requestUpdateCustomerEmailAddress;

        if (updateResult.__typename !== 'Success') {
            return { error: updateResult.message };
        }

        return { success: true };
    } catch (error: unknown) {
        return { error: 'An unexpected error occurred. Please try again.' };
    }
}

export async function unlinkWalletAction() {
    const token = await getZKeyAuthToken();
    if (!token) {
        return { success: false, error: 'Not authenticated with wallet' };
    }

    try {
        await zkey.unlinkWallet(token);

        await revalidateAuth();
        revalidatePath('/account/profile');
        return { success: true };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Failed to unlink wallet' };
    }
}

export async function linkWalletAction(address: string, signature: string) {
    const token = await getZKeyAuthToken();
    if (!token) {
        return { success: false, error: 'Not authenticated with ZKey' };
    }

    try {
        await zkey.linkWallet(token, address, signature);

        await revalidateAuth();
        revalidatePath('/account/profile');
        return { success: true };
    } catch (e) {
        return { success: false, error: e instanceof Error ? e.message : 'Failed to link wallet' };
    }
}

export async function getNonceAction(address: string) {
    try {
        return await zkey.getWalletNonce(address);
    } catch (e) {
        console.error('Failed to get wallet nonce:', e);
        return { nonce: null };
    }
}
