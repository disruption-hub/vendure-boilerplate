'use client';

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";

interface CartIconProps {
    cartItemCount: number;
}

export function CartIcon({ cartItemCount }: CartIconProps) {
    const { openCart, cart } = useCart();
    // Use client-side cart count if available (after hydration/fetch), otherwise use server-passed count (SSR)
    const count = cart ? cart.totalQuantity : cartItemCount;

    return (
        <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
                <span
                    className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {count}
                </span>
            )}
            <span className="sr-only">Shopping Cart</span>
        </Button>
    );
}
