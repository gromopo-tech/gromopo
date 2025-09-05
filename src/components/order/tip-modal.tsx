'use client';

import { useState } from 'react';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  onConfirm: (tipAmount: number) => void;
}

export default function TipModal({ isOpen, onClose, subtotal, onConfirm }: TipModalProps) {
  const [selectedTip, setSelectedTip] = useState<'15' | '20' | '25' | 'none'>('15');

  if (!isOpen) return null;

  const calculateTip = () => {
    switch (selectedTip) {
      case '15':
        return subtotal * 0.15;
      case '20':
        return subtotal * 0.20;
      case '25':
        return subtotal * 0.25;
      case 'none':
        return 0;
      default:
        return 0;
    }
  };

  const tipAmount = calculateTip();
  const total = subtotal + tipAmount;

  const handleConfirm = () => {
    onConfirm(tipAmount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Add Tip</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Your order total is ${subtotal.toFixed(2)}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {/* 15% Tip */}
          <button
            onClick={() => setSelectedTip('15')}
            className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
              selectedTip === '15'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">15% (Recommended)</span>
              <span className="text-gray-600 dark:text-gray-300">
                +${(subtotal * 0.15).toFixed(2)}
              </span>
            </div>
          </button>

          {/* 20% Tip */}
          <button
            onClick={() => setSelectedTip('20')}
            className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
              selectedTip === '20'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">20%</span>
              <span className="text-gray-600 dark:text-gray-300">
                +${(subtotal * 0.20).toFixed(2)}
              </span>
            </div>
          </button>

          {/* 25% Tip */}
          <button
            onClick={() => setSelectedTip('25')}
            className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
              selectedTip === '25'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">25%</span>
              <span className="text-gray-600 dark:text-gray-300">
                +${(subtotal * 0.25).toFixed(2)}
              </span>
            </div>
          </button>

          {/* No Tip */}
          <button
            onClick={() => setSelectedTip('none')}
            className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
              selectedTip === 'none'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">No Tip</span>
              <span className="text-gray-600 dark:text-gray-300">+$0.00</span>
            </div>
          </button>
        </div>

        {/* Total Summary */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Tip:</span>
            <span>+${tipAmount.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-600 pt-2">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Pay ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}
