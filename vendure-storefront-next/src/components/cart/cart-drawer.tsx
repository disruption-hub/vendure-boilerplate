'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetClose,
} from '@/components/ui/sheet';
import { useCart } from '@/contexts/cart-context';
import { Button } from '@/components/ui/button';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { Price } from '@/components/commerce/price';
import { adjustQuantity, removeFromCart } from '@/app/cart/actions';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useTransition } from 'react';
import Link from 'next/link';

export function CartDrawer() {
    const { isOpen, closeCart, cart, refreshCart } = useCart();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [updatingLineId, setUpdatingLineId] = useState<string | null>(null);

    const subTotal = cart?.subTotalWithTax || 0;
    const currencyCode = cart?.currencyCode || 'USD';
    const lines = cart?.lines || [];

    const handleUpdateQuantity = (lineId: string, quantity: number) => {
        setUpdatingLineId(lineId);
        startTransition(async () => {
            if (quantity === 0) {
                await removeFromCart(lineId);
            } else {
                await adjustQuantity(lineId, quantity);
            }
            await refreshCart();
            setUpdatingLineId(null);
            router.refresh();
        });
    };

    const handleCheckout = () => {
        closeCart();
        router.push('/checkout');
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
                <SheetHeader className="px-4 py-4 border-b">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5" />
                            Shopping Cart ({cart?.totalQuantity || 0})
                        </SheetTitle>
                        {/* Close button is automatically added by SheetContent, but we can customize or rely on default */}
                    </div>
                </SheetHeader>

                {!cart || lines.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                            <ShoppingBag className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">Your cart is empty</h3>
                            <p className="text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
                        </div>
                        <Button onClick={closeCart} variant="outline" className="mt-4">
                            Continue Shopping
                        </Button>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 px-4">
                            <div className="py-4 space-y-6">
                                {lines.map((line) => (
                                    <div key={line.id} className="flex gap-4">
                                        <div className="relative w-20 h-20 bg-muted rounded-md overflow-hidden flex-shrink-0">
                                            {line.productVariant.product.featuredAsset ? (
                                                <Image
                                                    src={line.productVariant.product.featuredAsset.preview}
                                                    alt={line.productVariant.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                                    <ShoppingBag className="w-6 h-6 text-muted-foreground/30" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div className="space-y-1">
                                                <h4 className="font-medium text-sm line-clamp-2">
                                                    {line.productVariant.product.name}
                                                </h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {line.productVariant.name !== line.productVariant.product.name
                                                        ? line.productVariant.name
                                                        : line.productVariant.sku}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex items-center border rounded-md h-8">
                                                    <button
                                                        className="px-2 h-full hover:bg-muted disabled:opacity-50 transition-colors"
                                                        onClick={() => handleUpdateQuantity(line.id, line.quantity - 1)}
                                                        disabled={isPending && updatingLineId === line.id}
                                                    >
                                                        <Minus className="w-3 h-3" />
                                                    </button>
                                                    <span className="px-2 text-sm min-w-[1.5rem] text-center">
                                                        {isPending && updatingLineId === line.id ? '...' : line.quantity}
                                                    </span>
                                                    <button
                                                        className="px-2 h-full hover:bg-muted disabled:opacity-50 transition-colors"
                                                        onClick={() => handleUpdateQuantity(line.id, line.quantity + 1)}
                                                        disabled={isPending && updatingLineId === line.id}
                                                    >
                                                        <Plus className="w-3 h-3" />
                                                    </button>
                                                </div>
                                                <div className="font-medium text-sm">
                                                    <Price
                                                        value={line.linePriceWithTax}
                                                        currencyCode={currencyCode}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="border-t p-4 space-y-4 bg-background">
                            <div className="flex items-center justify-between font-semibold">
                                <span>Subtotal</span>
                                <Price value={subTotal} currencyCode={currencyCode} />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Shipping and taxes calculated at checkout.
                            </p>
                            <SheetFooter className="flex-col gap-2 sm:justify-center sm:space-x-0">
                                <Button size="lg" className="w-full" onClick={handleCheckout}>
                                    Checkout
                                </Button>
                                <SheetClose asChild>
                                    <Button variant="outline" className="w-full">
                                        Continue Shopping
                                    </Button>
                                </SheetClose>
                            </SheetFooter>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
