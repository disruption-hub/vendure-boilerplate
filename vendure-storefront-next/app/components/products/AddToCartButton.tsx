'use client';

import { addItemToOrder } from '@/app/providers/cart-data.client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/app/providers/cart-context';

export function AddToCartButton({ productVariantId }: { productVariantId?: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const { setIsCartOpen } = useCart();

    async function handleAddToCart() {
        if (!productVariantId) {
            return;
        }
        setLoading(true);
        try {
            const result = await addItemToOrder(productVariantId, 1);
            console.log('AddToCart Result:', result);
            router.refresh();
            setIsCartOpen(true);
        } catch (error) {
            console.error('Failed to add to cart', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleAddToCart}
            disabled={loading || !productVariantId}
            className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-primary-600 px-8 py-3 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {loading ? 'Adding...' : 'Add to bag'}
        </button>
    );
}
