"use client";

import { useEffect, useState, useContext } from 'react';
import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { BusinessIdContext } from '@/components/business/business-id-provider';
import { BusinessNameContext } from '@/components/business/business-name-provider';
import { SolanaPay } from '@/components/solana/solana-pay';
import { PaymentProps } from '@/types/payment';

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
      try {
        if (!businessId) throw new Error('No businessId found for user');
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = now.getFullYear();
        const dateStr = dd + mm + yyyy;
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
        const q = query(
          collection(db, `businesses/${businessId}/orders`),
          where('createdAt', '>=', startOfDay),
          where('createdAt', '<=', endOfDay)
        );
        const snapshot = await getDocs(q);
        const orderNumber = snapshot.size + 1;
        const orderData = {
          cart,
          createdAt: new Date().toISOString(),
          orderNumber,
          status: 'Order Created',
          total,
          customerName,
          orderType,
          reference,
        };
        await setDoc(doc(db, `businesses/${businessId}/orders`, `${dateStr}-${orderNumber}`), orderData);
        clearCart();
      } catch (err) {
        alert('Failed to submit order: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };
    if (paymentStatus === 'confirmed') {
      submitOrder().then(() => {
        window.location.href = '/dashboard/orders/take/confirmation';
      });
    }
  }, [paymentStatus, reference, total, cart, businessId, customerName, orderType, clearCart]);

  return (
    <div className="p-4 border w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-2">Payment</h2>
      <p className="text-lg font-semibold">Pay with:</p>
      <div className="flex gap-2 mb-4">
        <button
          className="btn border mb-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
          onClick={() => setShowSolanaPay(true)}
          disabled={paymentStatus === 'pending'}
        >
          Solana Pay
        </button>
      </div>
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