'use server';

import { GetActiveOrderQuery } from '@/lib/vendure/queries';
import { query, mutate } from '@/lib/vendure/api';
import {
    RemoveFromCartMutation,
    AdjustCartItemMutation,
    ApplyPromotionCodeMutation,
    RemovePromotionCodeMutation,
    TransitionOrderToStateMutation,
} from '@/lib/vendure/mutations';
import { revalidateTag } from 'next/cache';
import { setAuthToken } from '@/lib/auth';

async function transitionActiveOrderToState(state: string): Promise<boolean> {
    try {
        const res = await mutate(TransitionOrderToStateMutation, { state }, { useAuthToken: true });
        if (res.token) await setAuthToken(res.token);
        const result: any = (res.data as any).transitionOrderToState;
        return result?.__typename === 'Order';
    } catch {
        return false;
    }
}

async function recoverActiveOrderToModifiableState(): Promise<'adding-items' | 'cancelled' | 'failed'> {
    if (await transitionActiveOrderToState('AddingItems')) return 'adding-items';
    if (await transitionActiveOrderToState('Cancelled')) return 'cancelled';
    return 'failed';
}

export async function removeFromCart(lineId: string) {
    const attempt = async () => {
        const r = await mutate(RemoveFromCartMutation, { lineId }, { useAuthToken: true });
        if (r.token) await setAuthToken(r.token);
        return r;
    };

    try {
        const res = await attempt();
        const result: any = (res.data as any).removeOrderLine;
        if (result?.__typename === 'ErrorResult' && result.message?.includes('AddingItems')) {
            const recovered = await recoverActiveOrderToModifiableState();
            if (recovered === 'adding-items') {
                await attempt();
            }
        }
    } catch (e: any) {
        if (String(e?.message || '').includes('AddingItems')) {
            const recovered = await recoverActiveOrderToModifiableState();
            if (recovered === 'adding-items') {
                await attempt();
            }
            return;
        }
        throw e;
    } finally {
        revalidateTag('cart', { expire: 0 });
        revalidateTag('active-order', { expire: 0 });
    }
}

export async function adjustQuantity(lineId: string, quantity: number) {
    const attempt = async () => {
        const r = await mutate(AdjustCartItemMutation, { lineId, quantity }, { useAuthToken: true });
        if (r.token) await setAuthToken(r.token);
        return r;
    };

    try {
        const res = await attempt();
        const result: any = (res.data as any).adjustOrderLine;
        if (result?.__typename === 'ErrorResult' && result.message?.includes('AddingItems')) {
            const recovered = await recoverActiveOrderToModifiableState();
            if (recovered === 'adding-items') {
                await attempt();
            }
        }
    } catch (e: any) {
        if (String(e?.message || '').includes('AddingItems')) {
            const recovered = await recoverActiveOrderToModifiableState();
            if (recovered === 'adding-items') {
                await attempt();
            }
            return;
        }
        throw e;
    } finally {
        revalidateTag('cart', { expire: 0 });
        revalidateTag('active-order', { expire: 0 });
    }
}

export async function applyPromotionCode(formData: FormData) {
    const code = formData.get('code') as string;
    if (!code) return;

    const attempt = async () => {
        const r = await mutate(ApplyPromotionCodeMutation, { couponCode: code }, { useAuthToken: true });
        if (r.token) await setAuthToken(r.token);
        return r;
    };

    try {
        const res = await attempt();
        const result: any = (res.data as any).applyCouponCode;
        if (result?.__typename === 'ErrorResult' && result.message?.includes('AddingItems')) {
            const recovered = await recoverActiveOrderToModifiableState();
            if (recovered === 'adding-items') {
                await attempt();
            }
        }
    } catch (e: any) {
        if (String(e?.message || '').includes('AddingItems')) {
            const recovered = await recoverActiveOrderToModifiableState();
            if (recovered === 'adding-items') {
                await attempt();
            }
            return;
        }
        throw e;
    } finally {
        revalidateTag('cart', { expire: 0 });
        revalidateTag('active-order', { expire: 0 });
    }
}

export async function removePromotionCode(formData: FormData) {
    const code = formData.get('code') as string;
    if (!code) return;

    const attempt = async () => {
        const r = await mutate(RemovePromotionCodeMutation, { couponCode: code }, { useAuthToken: true });
        if (r.token) await setAuthToken(r.token);
        return r;
    };

    try {
        await attempt();
    } catch (e: any) {
        if (String(e?.message || '').includes('AddingItems')) {
            const recovered = await recoverActiveOrderToModifiableState();
            if (recovered === 'adding-items') {
                await attempt();
            }
        } else {
            throw e;
        }
    } finally {
        revalidateTag('cart', { expire: 0 });
        revalidateTag('active-order', { expire: 0 });
    }
}

export async function resetCart() {
    await transitionActiveOrderToState('Cancelled');
    revalidateTag('cart', { expire: 0 });
    revalidateTag('active-order', { expire: 0 });
}

export async function unlockCart() {
    // Best-effort: move the active order back to a modifiable state.
    const ok = await transitionActiveOrderToState('AddingItems');
    revalidateTag('cart', { expire: 0 });
    revalidateTag('active-order', { expire: 0 });
    revalidateTag('active-order', { expire: 0 });
    return ok;
}

export async function getCart() {
    try {
        const result = await query(GetActiveOrderQuery, undefined, {
            useAuthToken: true,
            tags: ['cart']
        });
        return result.data?.activeOrder;
    } catch (e) {
        return null;
    }
}
