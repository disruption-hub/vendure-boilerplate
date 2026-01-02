'use server';

import { mutate } from '@/lib/vendure/api';
import {
    RemoveFromCartMutation,
    AdjustCartItemMutation,
    ApplyPromotionCodeMutation,
    RemovePromotionCodeMutation
} from '@/lib/vendure/mutations';
import { revalidateTag } from 'next/cache';
import { setAuthToken } from '@/lib/auth';

export async function removeFromCart(lineId: string) {
    const res = await mutate(RemoveFromCartMutation, { lineId }, { useAuthToken: true });
    if (res.token) {
        await setAuthToken(res.token);
    }
    revalidateTag('cart', { expire: 0 });
    revalidateTag('active-order', { expire: 0 });
}

export async function adjustQuantity(lineId: string, quantity: number) {
    const res = await mutate(AdjustCartItemMutation, { lineId, quantity }, { useAuthToken: true });
    if (res.token) {
        await setAuthToken(res.token);
    }
    revalidateTag('cart', { expire: 0 });
    revalidateTag('active-order', { expire: 0 });
}

export async function applyPromotionCode(formData: FormData) {
    const code = formData.get('code') as string;
    if (!code) return;

    const res = await mutate(ApplyPromotionCodeMutation, { couponCode: code }, { useAuthToken: true });
    if (res.token) {
        await setAuthToken(res.token);
    }
    revalidateTag('cart', { expire: 0 });
    revalidateTag('active-order', { expire: 0 });
}

export async function removePromotionCode(formData: FormData) {
    const code = formData.get('code') as string;
    if (!code) return;

    const res = await mutate(RemovePromotionCodeMutation, { couponCode: code }, { useAuthToken: true });
    if (res.token) {
        await setAuthToken(res.token);
    }
    revalidateTag('cart', { expire: 0 });
    revalidateTag('active-order', { expire: 0 });
}
