'use server';

import { mutate } from '@/lib/vendure/api';
import { AddToCartMutation, TransitionOrderToStateMutation } from '@/lib/vendure/mutations';
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

async function recoverActiveOrderToAddItemsOrCancel(): Promise<'adding-items' | 'cancelled' | 'failed'> {
  if (await transitionActiveOrderToState('AddingItems')) return 'adding-items';
  if (await transitionActiveOrderToState('Cancelled')) return 'cancelled';
  return 'failed';
}

export async function addToCart(variantId: string, quantity: number = 1) {
  try {
    const attemptAdd = async () => {
      const r = await mutate(AddToCartMutation, { variantId, quantity }, { useAuthToken: true });
      if (r.token) {
        await setAuthToken(r.token);
      }
      return r;
    };

    const result = await attemptAdd();

    if (result.data.addItemToOrder.__typename === 'Order') {
      // Revalidate cart data across all pages
      revalidateTag('cart', { expire: 0 });
      revalidateTag('active-order', { expire: 0 });
      return { success: true, order: result.data.addItemToOrder };
    } else {
      const message = result.data.addItemToOrder.message;
      // If the active order is stuck in a non-modifiable state (e.g. ArrangingPayment), attempt to move it back.
      if (message?.includes('AddingItems')) {
        const recovered = await recoverActiveOrderToAddItemsOrCancel();
        revalidateTag('cart', { expire: 0 });
        revalidateTag('active-order', { expire: 0 });

        if (recovered === 'adding-items' || recovered === 'cancelled') {
          const retry = await attemptAdd();
          if (retry.data.addItemToOrder.__typename === 'Order') {
            revalidateTag('cart', { expire: 0 });
            revalidateTag('active-order', { expire: 0 });
            return { success: true, order: retry.data.addItemToOrder };
          }
          return { success: false, error: retry.data.addItemToOrder.message };
        }
      }

      return { success: false, error: message };
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    return { success: false, error: 'Failed to add item to cart' };
  }
}
