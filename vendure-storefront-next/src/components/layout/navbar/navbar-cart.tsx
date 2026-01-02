import { cacheLife, cacheTag } from 'next/cache';
import { CartIcon } from './cart-icon';
import { query } from '@/lib/vendure/api';
import { GetActiveOrderQuery } from '@/lib/vendure/queries';

export async function NavbarCart() {
    'use cache: private';
    cacheLife('minutes');
    cacheTag('cart');
    cacheTag('active-order');

    let cartItemCount = 0;
    try {
        const orderResult = await query(GetActiveOrderQuery, undefined, {
            useAuthToken: true,
            tags: ['cart'],
        });
        cartItemCount = orderResult.data?.activeOrder?.totalQuantity || 0;
    } catch {
        // Vendure API may be offline during local dev; keep navbar rendering.
        cartItemCount = 0;
    }

    return <CartIcon cartItemCount={cartItemCount} />;
}
