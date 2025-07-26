'use client';

import { useState } from 'react';
import type { CartItem } from '@/types/cart';
import { 
  Sandwichesize,
  ItemSize,
  MenuItem 
} from './menu-types';
import { signatureSandwiches } from './menu-data/signature-sandwiches';
import { hotSandwiches } from './menu-data/hot-sandwiches';
// These will be added back later when needed:
// import { sides } from './menu-data/sides';
// import { drinks } from './menu-data/drinks';

interface MenuProps {
  PaymentActions: React.ComponentType<{
    total: number;
    cart: CartItem[];
    customerName: string;
    orderType: 'takeout' | 'dine-in';
    clearCart: () => void;
  }>;
}
export default function Menu({ PaymentActions }: MenuProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<'takeout' | 'dine-in'>('takeout');
  const [customerName, setCustomerName] = useState('');
  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const addToCart = (item: MenuItem, size: ItemSize) => {
    let price: number | undefined;
    
    if (size === 'REGULAR') {
      price = (item.price as { REGULAR: number }).REGULAR;
    } else {
      price = (item.price as { [key in Sandwichesize]?: number })[size];
    }
    
    if (price === undefined) return;

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

  // For rendering the available menu items
  const renderMenuItem = (item: MenuItem) => {
    // Determine if it's a sandwich with sizes or a regular item
    const hasSizes = 'FULL' in item.price || 'MINI' in item.price;
    
    return (
      <div key={item.name} className="border-b py-2">
        <h2 className="text-lg font-semibold">{item.name}</h2>
        <p className="text-sm">{item.description}</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {hasSizes ? (
            // For items with sizes (FULL/MINI)
            (['FULL', 'MINI'] as Sandwichesize[]).map((size) => {
              const sandwichPrices = item.price as { [key in Sandwichesize]?: number };
              const price = sandwichPrices[size];
              
              return price ? (
                <button
                  key={size}
                  className="px-3 py-1 border rounded hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
                  onClick={() => addToCart(item, size)}
                >
                  {size} - ${price}
                </button>
              ) : null;
            })
          ) : (
            // For regular items (like sides and drinks)
            <button
              className="px-3 py-1 border rounded hover:bg-gray-100 hover:text-gray-800"
              onClick={() => addToCart(item, 'REGULAR' as ItemSize)}
            >
              Add to Cart - ${(item.price as { REGULAR: number }).REGULAR}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Signature Sandwiches Section */}
      <h1 className="text-2xl font-bold mb-4">Signature Nooners</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {signatureSandwiches.map(renderMenuItem)}
      </div>
      
      {/* Hot Sandwiches Section */}
      <h1 className="text-2xl font-bold mb-4">Hot Nooners</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {hotSandwiches.map(renderMenuItem)}
      </div>
      
      {/* These sections will be added back later:
      <h1 className="text-2xl font-bold mb-4">Sides</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {sides.map(renderMenuItem)}
      </div>
      
      <h1 className="text-2xl font-bold mb-4">Drinks</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {drinks.map(renderMenuItem)}
      </div>
      */}

      <h2 className="text-xl font-bold mt-6">Cart</h2>
      {cart.length === 0 ? (
        <p>The cart is empty.</p>
      ) : (
        <>
          <ul className="mt-2 space-y-1">
            {cart.map((item, index) => (
              <li key={index} className="text-sm">
                <span>
                  {item.name} ({item.size}) - ${item.price}
                </span>
                <button
                  className="ml-2 text-red-500 hover:text-red-700"
                  onClick={() => removeFromCart(index)}
                >
                  Remove
                </button>
              </li>
            ))}
            <li className="text-lg font-bold mt-2">Total: ${total}</li>
          </ul>
          {/* Customer name input */}
          <div className="my-4">
            <label className="font-semibold mr-2" htmlFor="customerName">Name:</label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="border rounded px-2 py-1"
              placeholder="your name"
            />
          </div>
          {/* Order type radio buttons */}
          <div className="my-4">
            <label className="font-semibold mr-4">Type of order:</label>
            <label className="mr-4">
              <input
                type="radio"
                name="orderType"
                value="takeout"
                checked={orderType === 'takeout'}
                onChange={() => setOrderType('takeout')}
                className="mr-1"
              />
              takeout
            </label>
            <label>
              <input
                type="radio"
                name="orderType"
                value="dine-in"
                checked={orderType === 'dine-in'}
                onChange={() => setOrderType('dine-in')}
                className="mr-1"
              />
              dine-in
            </label>
          </div>
          <PaymentActions
            total={total}
            cart={cart}
            customerName={customerName}
            orderType={orderType}
            clearCart={() => setCart([])}
          />
        </>
      )}
    </div>
  );
}
