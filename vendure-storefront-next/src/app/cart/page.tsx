import type { Metadata } from 'next';
import { Cart } from "@/app/cart/cart";
import { Suspense } from "react";
import { CartSkeleton } from "@/components/shared/skeletons/cart-skeleton";
import { noIndexRobots } from '@/lib/metadata';

export const metadata: Metadata = {
    title: 'Shopping Cart',
    description: 'Review items in your shopping cart.',
    robots: noIndexRobots(),
};

export default async function CartPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const searchParams = await props.searchParams;
    return (
        <div className="container mx-auto px-4 py-20">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

            <Suspense fallback={<CartSkeleton />}>
                <Cart />
            </Suspense>
        </div>
    );
}
