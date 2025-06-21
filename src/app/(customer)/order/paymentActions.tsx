'use client';

import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
// Firestore imports
import { submitOrderToFirestore } from '@/lib/order';
import { useRouter } from 'next/navigation';
import { CartItem } from '@/types/cart';
import { PaymentProps } from '@/types/payment';
import { handleSolanaPayPayment } from '@/lib/payment-solanapay';

export function PaymentActions({
  solTotal,
  arsTotal,
  cart = [],
  customerName = 'Test Customer',
  businessId = 'kQKIuVShyepX9h8OqxdG',
  businessName = 'Pizza Hero',
  orderType = 'retirar',
  onSuccess,
  onError,
  clearCart,
}: PaymentProps) {
  const router = useRouter();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [cartSnapshot, setCartSnapshot] = useState<CartItem[]>([]);

  // Hardcoded destination wallet for demo (replace with your business wallet)
  const businessWallet = 'Gd5DD65JrQXUALt839cUyr8h42aLUCdveJhLfdMmFLTa';

  // Submit order to Firestore after payment
  const submitOrder = async () => {
    try {
      const orderData = await submitOrderToFirestore({
        cart,
        arsTotal: arsTotal ?? 0,
        solTotal: solTotal ?? 0,
        customerName,
        businessId,
        businessName,
        txSignature,
        orderType,
      });
      setOrderNumber(orderData.orderNumber);
      setOrderConfirmed(true);
      setOrderError(null);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handlePay = async () => {
    await handleSolanaPayPayment({
      solTotal,
      cart,
      businessWallet,
      publicKey,
      sendTransaction,
      connection,
      onSuccess: (signature: string) => {
        setTxSignature(signature);
        setCartSnapshot(cart);
        setPaymentStatus('success');
        onSuccess?.(signature);
      },
      onError: () => {
        setPaymentStatus('error');
        onError?.();
      },
      setPaymentStatus,
      setTxSignature,
      setCartSnapshot,
    });
  };

  // Firestore order submission after payment success
  useEffect(() => {
    if (paymentStatus === 'success' && txSignature && !orderConfirmed && businessId) {
      submitOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStatus, txSignature, businessId]);

  // Clear cart only after order is confirmed
  useEffect(() => {
    if (orderConfirmed) {
      clearCart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderConfirmed]);

  // Redirect to confirmation page after order is confirmed
  useEffect(() => {
    if (orderConfirmed && orderNumber) {
      // Save order details to sessionStorage for the confirmation page
      const orderDetails = {
        orderNumber,
        customerName: customerName || 'Test Customer',
        arsTotal,
        solTotal,
        cart: cartSnapshot.length > 0 ? cartSnapshot : cart,
        txSignature,
        orderType,
      };
      sessionStorage.setItem('orderConfirmation', JSON.stringify(orderDetails));
      router.push('/order/confirmation');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderConfirmed, orderNumber]);

  return (
    <div className="flex flex-col gap-2 mt-4">
      <p className="text-lg font-semibold">Pagar con:</p>
      <div className="flex gap-2">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          onClick={() => alert('Integración con Mercado Pago próximamente')}
          type="button"
        >
          Mercado Pago
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          onClick={handlePay}
          disabled={paymentStatus === 'pending' || !connected || !publicKey}
        >
          {paymentStatus === 'pending' ? 'Pagando...' : 'Solana Pay'}
        </button>
      </div>
      {/* Always show payment success if paymentStatus is success and txSignature exists */}
      {paymentStatus === 'success' && txSignature && (
        <div className="mt-2 text-green-600">
          ¡Pago realizado!{' '}
          <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="underline">Ver transacción</a>
        </div>
      )}
      {/* Show order confirmation below payment success if confirmed (now handled by redirect) */}
      {/* orderConfirmed && ... (removed) */}
      {orderError && (
        <div className="mt-2 text-red-600">Error al guardar la orden: {orderError}</div>
      )}
      {paymentStatus === 'error' && (
        <div className="mt-2 text-red-600">Error al procesar el pago.</div>
      )}
    </div>
  );
}