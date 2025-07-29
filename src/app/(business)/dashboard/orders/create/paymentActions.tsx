"use client";

import { useEffect, useState, useContext } from 'react';
import { BusinessIdContext } from '@/components/business/business-id-provider';
import { BusinessNameContext } from '@/components/business/business-name-provider';
import { SolanaPay } from '@/components/solana/solana-pay';
import { PaymentProps } from '@/types/payment';
import { submitOrderToFirestore } from '@/lib/order';
import { db } from '@/lib/firebase/config';

export function PaymentActions({
  total,
  cart = [],
  customerName,
  orderType,
  clearCart,
}: PaymentProps) {
  const businessId = useContext(BusinessIdContext);
  const businessName = useContext(BusinessNameContext);
  const [reference, setReference] = useState<string>('');
  const [merchantWallet, setMerchantWallet] = useState<string | null>(null);
  const [showSolanaPay, setShowSolanaPay] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch merchant wallet
  useEffect(() => {
    if (!businessId) {
      setMerchantWallet(null);
      return;
    }
    (async () => {
      try {
        const snap = await import('firebase/firestore').then(({ doc, getDoc }) => getDoc(doc(db, 'businesses', businessId)));
        if (snap.exists()) {
          setMerchantWallet(snap.data().merchantWallet || '');
        } else {
          setMerchantWallet('');
        }
      } catch (err) {
        console.error('Error fetching merchant wallet:', err);
        setMerchantWallet('');
      }
    })();
  }, [businessId]);

  // Track payment status
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'none'>('none');

  // Handler for SolanaPay confirmation
  const handleConfirmed = (ref: string) => {
    setReference(ref);
    setPaymentStatus('confirmed');
  };

  // Submit order to Firestore when payment is confirmed
  useEffect(() => {
    const submitOrder = async () => {
      if (!businessId || !businessName) {
        setOrderError('Missing business information');
        return;
      }
      
      setIsSubmitting(true);
      setOrderError(null);
      
      try {
        await submitOrderToFirestore({
          cart,
          total,
          customerName: customerName || '',
          businessId,
          businessName,
          txSignature: reference,
          orderType: orderType || 'takeout',
        });
        clearCart();
        window.location.href = '/dashboard/orders/take/confirmation';
      } catch (err) {
        setOrderError(err instanceof Error ? err.message : 'Failed to submit order');
      } finally {
        setIsSubmitting(false);
      }
    };
    
    if (paymentStatus === 'confirmed') {
      submitOrder();
    }
  }, [paymentStatus, reference, total, cart, businessId, businessName, customerName, orderType, clearCart]);

  return (
    <div className="p-4 border w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-2">Payment</h2>
      <p className="text-lg font-semibold">Pay with:</p>
      <div className="flex gap-2 mb-4">
        <button
          className="btn border mb-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
          onClick={() => setShowSolanaPay(true)}
          disabled={paymentStatus === 'pending' || isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Solana Pay'}
        </button>
      </div>
      
      {/* Error display */}
      {orderError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          Error: {orderError}
        </div>
      )}
      
      {showSolanaPay && (
        <SolanaPay
          total={total}
          customerName={customerName || ''}
          businessName={businessName || ''}
          merchantWallet={merchantWallet}
          onConfirmed={handleConfirmed}
        />
      )}
      <ul className="mb-2">
        {cart.map((item, idx) => (
          <li key={idx}><b>{item.name}</b> ({item.size}) - ${item.price}</li>
        ))}
        <li><b>Total:</b> {total.toFixed(4)} USDC</li>
        <li><b>Customer:</b> {customerName}</li>
        <li><b>Order Type:</b> {orderType}</li>
      </ul>
    </div>
  );
}