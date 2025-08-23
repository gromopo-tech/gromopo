"use client";

import { useEffect, useState, useContext, useRef } from 'react';
import { BusinessIdContext } from '@/components/protected/business-id-provider';
import { BusinessNameContext } from '@/components/protected/business-name-provider';
import { SolanaPay } from '@/components/solana/solana-pay';
import { PaymentProps } from '@/types/payment';
import { submitOrderToFirestore } from '@/lib/order';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';

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
  
  // Add a ref to track if order has been submitted
  const orderSubmittedRef = useRef(false);

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
      // Prevent multiple submissions
      if (orderSubmittedRef.current || !businessId || !businessName || isSubmitting) {
        return;
      }
      
      orderSubmittedRef.current = true;
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
        window.location.href = '/dashboard/orders/create/confirmation';
      } catch (err) {
        orderSubmittedRef.current = false; // Reset on error so user can retry
        setOrderError(err instanceof Error ? err.message : 'Failed to submit order');
      } finally {
        setIsSubmitting(false);
      }
    };
    
    if (paymentStatus === 'confirmed' && !orderSubmittedRef.current) {
      submitOrder();
    }
  }, [paymentStatus, businessId, businessName, cart, clearCart, customerName, isSubmitting, orderType, reference, total]);

  return (
    <div className="w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-2">Pay ${total.toFixed(2)} with:</h2>
      <div className="flex gap-2 mb-4">
        <button
          className="btn border mb-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
          onClick={() => {
            // Check for errors before showing QR code
            if (!merchantWallet || merchantWallet.length === 0) {
              toast.error('Merchant wallet not set. Please check business settings.');
              return;
            }
            if (total <= 0) {
              toast.error('The cart is empty.');
              return;
            }
            if (!customerName || customerName.trim() === '') {
              toast.error('Customer name is required.');
              return;
            }
            setShowSolanaPay(true);
          }}
          disabled={paymentStatus === 'pending' || isSubmitting || orderSubmittedRef.current}
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
      
      {showSolanaPay && !orderSubmittedRef.current && (
        <SolanaPay
          total={total}
          customerName={customerName || ''}
          businessName={businessName || ''}
          merchantWallet={merchantWallet}
          onConfirmed={handleConfirmed}
        />
      )}
    </div>
  );
}