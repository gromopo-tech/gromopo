'use client';

import { CartItem } from '@/types/cart';

interface OrderDetailsProps {
  cart: CartItem[];
  total: number;
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onRemoveFromCart: (index: number) => void;
}

export default function OrderDetails({
  cart,
  total,
  customerName,
  onCustomerNameChange,
  onRemoveFromCart,
}: OrderDetailsProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Order Details:</h2>
      
      {/* Customer Info */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Customer Name:
          <input
            type="text"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Enter your name"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </label>
      </div>

      {/* Cart */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Your Order</h3>
        {cart.length === 0 ? (
          <p className="text-gray-500">Your cart is empty</p>
        ) : (
          <ul className="space-y-2">
            {cart.map((item, index) => (
              <li key={index} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm ml-2">({item.size})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>${item.price.toFixed(2)}</span>
                  <button
                    onClick={() => onRemoveFromCart(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
            <li className="font-bold text-lg border-t pt-2">
              Total: ${total.toFixed(2)}
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}