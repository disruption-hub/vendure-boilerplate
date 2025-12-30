'use client';

import React, { createContext, useContext, useState } from 'react';

interface CartContextType {
    isCartOpen: boolean;
    setIsCartOpen: (open: boolean) => void;
    toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState(false);

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    return (
        <CartContext.Provider value={{ isCartOpen, setIsCartOpen, toggleCart }}>
            {children}
            {/* We'll add the CartTray component here in the layout usually, 
                but the provider just holds state */}
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
