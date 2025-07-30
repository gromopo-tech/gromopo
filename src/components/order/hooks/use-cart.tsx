'use client';

import { useState } from 'react';
import { MenuItem } from '@/types/menu';
import { CartItem } from '@/types/cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'takeout' | 'dine-in' | 'delivery'>('takeout');
  const [customerName, setCustomerName] = useState('');
  
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const addToCart = (item: MenuItem, size: string) => {
    let price: number | undefined;
    
    // Handle different price structures
    if (typeof item.price === 'number') {
      // Single price item
      price = item.price;
    } else if (typeof item.price === 'object') {
      // Size-based pricing
      price = item.price[size];
    }
    
    if (price === undefined) {
      console.warn(`Price not found for ${item.name} with size ${size}`);
      return;
    }

    const cartItem: CartItem = {
      name: item.name,
      description: item.description,
      size,
      price,
    };
    setCart([...cart, cartItem]);
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
    orderType,
    setOrderType,
    customerName,
    setCustomerName,
    addToCart,
    removeFromCart,
    clearCart,
  };
}