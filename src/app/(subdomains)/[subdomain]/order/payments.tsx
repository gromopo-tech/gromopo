'use client';

import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { submitOrderToFirestore } from '@/lib/order';
import { useRouter } from 'next/navigation';
import { CartItem } from '@/types/cart';
import { handleSolanaPayPayment } from '@/lib/solana/wallet-payment';
import { toast } from 'sonner';
import { WalletButton } from '@/components/solana/solana-provider';
import TipModal from '@/components/order/tip-modal';

interface PaymentsProps {
  total: number;
  cart: CartItem[];
  customerName: string;
  businessId: string;
  businessName: string;
  clearCart: () => void;
  onSuccess?: (signature: string) => void;
  onError?: () => void;
}

export function Payments({
  total,
  cart = [],
  customerName = 'Test Customer',
  businessId,
  businessName,
  onSuccess,
  onError,
  clearCart,
}: PaymentsProps) {
  const router = useRouter();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [cartSnapshot, setCartSnapshot] = useState<CartItem[]>([]);
  const [isTipModalOpen, setIsTipModalOpen] = useState(false);
  const [finalTotal, setFinalTotal] = useState(total);

  // Hardcoded destination wallet for demo (replace with your business wallet)
  const businessWallet = 'Gd5DD65JrQXUALt839cUyr8h42aLUCdveJhLfdMmFLTa';

  // Submit order to Firestore after payment
  const submitOrder = async () => {
    try {
      const orderData = await submitOrderToFirestore({
        cart,
        total: finalTotal ?? 0,
        customerName,
        businessId,
        businessName,
        txSignature,
      });
      setOrderNumber(orderData.orderNumber);
      setOrderConfirmed(true);
      setOrderError(null);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleSolanaPayClick = () => {
    // Check for errors before showing tip modal
    if (total <= 0) {
      toast.error('The cart is empty.');
      return;
    }
    if (!customerName || customerName.trim() === '') {
      toast.error('Customer name is required.');
      return;
    }
    
    // Open tip modal
    setIsTipModalOpen(true);
  };

  const handleTipConfirm = (selectedTipAmount: number) => {
    setFinalTotal(total + selectedTipAmount);
    setIsTipModalOpen(false);
    // Proceed with payment
    handlePayWithTip(total + selectedTipAmount);
  };

  const handlePayWithTip = async (totalWithTip: number) => {
    // Check balance before attempting payment
    try {
      const solBalance = await connection.getBalance(publicKey!);
      const feeBuffer = 0.00001 * 1000000000; // Fee buffer in lamports

      if (solBalance < feeBuffer) {
        toast.error('You don\'t have enough SOL to pay and cover the network fee.');
        return;
      }
    } catch (err) {
      toast.error('Failed to check wallet balance: ' + (err instanceof Error ? err.message : 'Unknown error'));
      return;
    }

    await handleSolanaPayPayment({
      total: totalWithTip,
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
        total: finalTotal,
        cart: cartSnapshot.length > 0 ? cartSnapshot : cart,
        txSignature,
      };
      sessionStorage.setItem('orderConfirmation', JSON.stringify(orderDetails));
      router.push(`/order/confirmation`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderConfirmed, orderNumber]);

  return (
    <div className="flex flex-col gap-2 mt-4">
      <h2 className="text-2xl font-bold mb-2">Pay ${total.toFixed(2)} with:</h2>
      <div className="flex gap-2">
        {(!connected || !publicKey) ? (
          <WalletButton />
        ) : (
          <button
            className="btn border mb-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
            onClick={handleSolanaPayClick}
          >
            {paymentStatus === 'pending' ? 'Paying...' : 'Solana Pay'}
          </button>
        )}
      </div>
      
      <TipModal
        isOpen={isTipModalOpen}
        onClose={() => setIsTipModalOpen(false)}
        subtotal={total}
        onConfirm={handleTipConfirm}
      />
      
      {orderError && (
        <div className="mt-2 text-red-600">Error saving order: {orderError}</div>
      )}
      {paymentStatus === 'error' && (
        <div className="mt-2 text-red-600">Error processing payment.</div>
      )}
    </div>
  );
}
