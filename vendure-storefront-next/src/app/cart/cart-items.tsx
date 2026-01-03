'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Minus, Plus, X, Loader2 } from 'lucide-react';
import { Price } from '@/components/commerce/price';
import { adjustQuantity, removeFromCart, resetCart, unlockCart } from './actions';
import { useEffect, useRef, useTransition } from 'react';
import { cn, getVendureImageUrl } from '@/lib/utils';
import { toast } from 'sonner';

type ActiveOrder = {
    id: string;
    state: string;
    currencyCode: string;
    lines: Array<{
        id: string;
        quantity: number;
        unitPriceWithTax: number;
        linePriceWithTax: number;
        productVariant: {
            id: string;
            name: string;
            sku: string;
            product: {
                name: string;
                slug: string;
                featuredAsset?: {
                    preview: string;
                } | null;
            };
        };
    }>;
};

export function CartItems({ activeOrder }: { activeOrder: ActiveOrder | null }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const autoUnlockAttemptedRef = useRef(false);

    useEffect(() => {
        if (!activeOrder) return;
        if (activeOrder.state === 'AddingItems') return;
        if (autoUnlockAttemptedRef.current) return;
        autoUnlockAttemptedRef.current = true;

        (async () => {
            const ok = await unlockCart();
            if (!ok) return;
            router.refresh();
        })();
    }, [activeOrder, router]);

    if (!activeOrder || activeOrder.lines.length === 0) {
        return (
            <div className="container mx-auto px-4 py-16">
                <div className="text-center">
                    <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
                    <p className="text-muted-foreground mb-8">
                        Add some items to your cart to get started
                    </p>
                    <Button asChild>
                        <Link href="/">Continue Shopping</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const handleAdjustQuantity = (lineId: string, quantity: number) => {
        startTransition(async () => {
            try {
                await adjustQuantity(lineId, quantity);
            } catch (e: any) {
                toast.error(e?.message || 'Unable to update cart');
            } finally {
                router.refresh();
            }
        });
    };

    const handleRemoveFromCart = (lineId: string) => {
        startTransition(async () => {
            try {
                await removeFromCart(lineId);
            } catch (e: any) {
                toast.error(e?.message || 'Unable to remove item');
            } finally {
                router.refresh();
            }
        });
    };

    const handleResetCart = () => {
        startTransition(async () => {
            try {
                await resetCart();
                toast.message('Cart reset');
            } catch (e: any) {
                toast.error(e?.message || 'Unable to reset cart');
            } finally {
                router.refresh();
            }
        });
    };

    const handleUnlockCart = () => {
        startTransition(async () => {
            try {
                const ok = await unlockCart();
                if (!ok) {
                    toast.error('Unable to unlock cart. Try Reset cart.');
                } else {
                    toast.message('Cart unlocked');
                }
            } catch (e: any) {
                toast.error(e?.message || 'Unable to unlock cart');
            } finally {
                router.refresh();
            }
        });
    };

    return (
        <div className={cn("lg:col-span-2 space-y-4 transition-opacity", isPending && "opacity-60 pointer-events-none")}>
            <div className="flex items-center justify-end">
                {activeOrder.state !== 'AddingItems' ? (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={handleUnlockCart}
                        className="mr-2"
                    >
                        Unlock cart
                    </Button>
                ) : null}
                <Button variant="outline" size="sm" disabled={isPending} onClick={handleResetCart}>
                    Reset cart
                </Button>
            </div>
            {activeOrder.lines.map((line) => (
                <div
                    key={line.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-card relative"
                >
                    {line.productVariant.product.featuredAsset && (
                        <Link
                            href={`/product/${line.productVariant.product.slug}`}
                            className="flex-shrink-0"
                        >
                            <Image
                                src={getVendureImageUrl(line.productVariant.product.featuredAsset.preview)}
                                alt={line.productVariant.name}
                                width={120}
                                height={120}
                                className="rounded-md object-cover w-full sm:w-[120px] h-[120px]"
                            />
                        </Link>
                    )}

                    <div className="flex-grow min-w-0">
                        <Link
                            href={`/product/${line.productVariant.product.slug}`}
                            className="font-semibold hover:underline block"
                        >
                            {line.productVariant.product.name}
                        </Link>
                        {line.productVariant.name !== line.productVariant.product.name && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {line.productVariant.name}
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                            SKU: {line.productVariant.sku}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2 sm:hidden">
                            <Price value={line.unitPriceWithTax} currencyCode={activeOrder.currencyCode} /> each
                        </p>

                        <div className="flex items-center gap-3 mt-4">
                            <div className="flex items-center gap-2 border rounded-md px-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={line.quantity <= 1 || isPending}
                                    onClick={() => handleAdjustQuantity(line.id, line.quantity - 1)}
                                >
                                    <Minus className="h-4 w-4" />
                                </Button>

                                <span className="w-8 text-center font-medium text-sm">
                                    {line.quantity}
                                </span>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    disabled={isPending}
                                    onClick={() => handleAdjustQuantity(line.id, line.quantity + 1)}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={isPending}
                                onClick={() => handleRemoveFromCart(line.id)}
                            >
                                <X className="h-5 w-5" />
                            </Button>

                            {isPending && (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            )}

                            <div className="sm:hidden ml-auto">
                                <p className="font-semibold text-lg">
                                    <Price value={line.linePriceWithTax}
                                        currencyCode={activeOrder.currencyCode} />
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="hidden sm:block text-right flex-shrink-0">
                        <p className="font-semibold text-lg">
                            <Price value={line.linePriceWithTax} currencyCode={activeOrder.currencyCode} />
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            <Price value={line.unitPriceWithTax} currencyCode={activeOrder.currencyCode} /> each
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
