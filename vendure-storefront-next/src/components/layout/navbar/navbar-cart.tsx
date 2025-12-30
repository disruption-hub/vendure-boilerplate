import { unstable_cacheLife, unstable_cacheTag } from 'next/cache';
import { CartIcon } from './cart-icon';
import { query } from '@/lib/vendure/api';
import { GetActiveOrderQuery } from '@/lib/vendure/queries';

export async function NavbarCart() {
    'use cache: private';
    unstable_cacheLife('minutes');
    unstable_cacheTag('cart');
    unstable_cacheTag('active-order');

    const orderResult = await query(GetActiveOrderQuery, undefined, {
        useAuthToken: true,
        tags: ['cart'],
    });

    const cartItemCount = orderResult.data?.activeOrder?.totalQuantity || 0;

    return <CartIcon cartItemCount={cartItemCount} />;
}
