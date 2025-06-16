import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
// Firestore imports
import { doc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';

interface CartItem {
  nombre: string;
  descripción: string;
  tamaño: string;
  precio: number;
}

interface PaymentProps {
  solTotal: number;
  arsTotal?: number;
  cart?: CartItem[];
  customerName?: string;
  businessId?: string;
  businessName?: string;
  orderType?: 'retirar' | 'comer en el lugar';
  onSuccess?: (txSignature: string | null) => void;
  onError?: () => void;
  clearCart: () => void;
}

export function PaymentActions({
  solTotal,
  arsTotal,
  cart = [],
  customerName = 'Test Customer',
  businessId = 'kQKIuVShyepX9h8OqxdG',
  businessName = 'Pizza Cero',
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
      if (!businessId) throw new Error('No businessId found');
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
      const nextOrderNumber = snapshot.size + 1;
      setOrderNumber(nextOrderNumber);
      const orderData = {
        cart,
        createdAt: new Date().toISOString(),
        orderNumber: nextOrderNumber,
        status: 'Order Created',
        arsTotal,
        solTotal,
        customerName,
        businessName,
        txSignature,
        orderType,
      };
      await setDoc(doc(db, `businesses/${businessId}/orders`, `${dateStr}-${nextOrderNumber}`), orderData);
      setOrderConfirmed(true);
      setOrderError(null);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handlePay = async () => {
    if (!connected || !publicKey) {
      alert('Conecta tu wallet para pagar.');
      return;
    }
    if (solTotal <= 0) {
      alert('El carrito está vacío.');
      return;
    }
    setPaymentStatus('pending');
    try {
      const lamportsAmount = Math.round(solTotal * LAMPORTS_PER_SOL);
      const balance = await connection.getBalance(publicKey);
      const feeBuffer = 0.00001 * LAMPORTS_PER_SOL;
      if (balance < lamportsAmount + feeBuffer) {
        setPaymentStatus('idle');
        alert('No tienes suficiente SOL para pagar y cubrir la comisión de la red.');
        return;
      }
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(businessWallet),
          lamports: lamportsAmount,
        })
      );
      tx.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      tx.recentBlockhash = blockhash;
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
      setTxSignature(signature);
      setCartSnapshot(cart); // Save cart for confirmation display
      setPaymentStatus('success');
      onSuccess?.(signature);
      // Do NOT clearCart here; clear after order is confirmed
    } catch {
      setPaymentStatus('error');
      onError?.();
    }
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
          {paymentStatus === 'pending' ? 'Pagando...' : 'Rewards'}
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
