'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getCart } from '@/app/cart/actions';
import { GetActiveOrderQuery } from '@/lib/vendure/queries';
import { ResultOf } from 'gql.tada';

// Helper type for the Active Order
type ActiveOrder = ResultOf<typeof GetActiveOrderQuery>['activeOrder'];

interface CartContextType {
    isOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
    cart: ActiveOrder | null;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [cart, setCart] = useState<ActiveOrder | null>(null);

    const openCart = useCallback(() => setIsOpen(true), []);
    const closeCart = useCallback(() => setIsOpen(false), []);
    const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

    const refreshCart = useCallback(async () => {
        try {
            const data = await getCart();
            setCart(data);
        } catch (error) {
            console.error('Failed to refresh cart:', error);
        }
    }, []);

    // Initial load
    useEffect(() => {
        refreshCart();
    }, [refreshCart]);

    return (
        <CartContext.Provider value={{ isOpen, openCart, closeCart, toggleCart, cart, refreshCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
