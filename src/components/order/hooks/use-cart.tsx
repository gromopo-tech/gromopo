'use client';

import { useState } from 'react';
import { CartItem } from '@/types/cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const addToCart = (cartItem: CartItem) => {
    setCart([...cart, cartItem]);
    // Show toast notification
    if (typeof window !== 'undefined') {
      // Import toast from 'sonner' directly
      import('sonner').then(({ toast }) => {
        toast.success(`${cartItem.name} (${cartItem.size}) added to cart!`);
      });
    }
  };

  const removeFromCart = (index: number) => {
    setCart(cart => cart.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  return {
    cart,
    total,
    customerName,
    setCustomerName,
    addToCart,
    removeFromCart,
    clearCart,
  };
}