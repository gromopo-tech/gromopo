"use client";

import { useState } from 'react';
import { MenuItem as MenuItemType } from '@/types/business';

interface ItemModalProps {
  item: MenuItemType & { category: string };
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItemType & { category: string }, size: string, quantity: number, specialInstructions: string) => void;
}

export default function ItemModal({ item, isOpen, onClose, onAddToCart }: ItemModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [specialInstructions, setSpecialInstructions] = useState<string>('');

  const isMultiSize = typeof item.price === 'object' && item.price !== null;
  const prices = isMultiSize ? (item.price as Record<string, number>) : { 'Regular': item.price as number };
  
  // Set default size when modal opens
  useState(() => {
    if (isOpen && !selectedSize) {
      const firstSize = Object.keys(prices)[0];
      setSelectedSize(firstSize);
    }
  });

  if (!isOpen) return null;

  const handleAddToCart = () => {
    if (!selectedSize) return;
    onAddToCart(item, selectedSize, quantity, specialInstructions);
    handleClose();
  };

  const handleClose = () => {
    setSelectedSize('');
    setQuantity(1);
    setSpecialInstructions('');
    onClose();
  };

  const selectedPrice = prices[selectedSize] || 0;
  const totalPrice = selectedPrice * quantity;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{item.name}</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">{item.description}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Size Selection */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Size</h3>
            <div className="grid gap-2">
              {Object.entries(prices).map(([sizeName, price]) => (
                <label
                  key={sizeName}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSize === sizeName
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      name="size"
                      value={sizeName}
                      checked={selectedSize === sizeName}
                      onChange={(e) => setSelectedSize(e.target.value)}
                      className="mr-3"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">{sizeName}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">${price.toFixed(2)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Quantity</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                disabled={quantity <= 1}
              >
                <span className="text-lg font-medium">-</span>
              </button>
              <span className="text-xl font-semibold min-w-[3rem] text-center text-gray-900 dark:text-white">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="text-lg font-medium">+</span>
              </button>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Special Instructions</h3>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests or modifications..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              rows={3}
            />
          </div>

          {/* Total Price */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!selectedSize}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
