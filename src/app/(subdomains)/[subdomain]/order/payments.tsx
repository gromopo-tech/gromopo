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
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

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
  const [merchantWallet, setMerchantWallet] = useState<string | null>(null);
  const [walletLoading, setWalletLoading] = useState(true);

  // Check if business has a merchant wallet configured
  useEffect(() => {
    const checkMerchantWallet = async () => {
      if (!businessId) {
        setWalletLoading(false);
        return;
      }

      try {
        const businessRef = doc(db, 'businesses', businessId);
        const businessSnap = await getDoc(businessRef);
        
        if (businessSnap.exists()) {
          const businessData = businessSnap.data();
          const wallet = businessData.merchantWallet;
          
          // Check if wallet exists and is not the placeholder value
          if (wallet && wallet !== '<merchant-wallet-address>') {
            setMerchantWallet(wallet);
          } else {
            setMerchantWallet(null);
          }
        } else {
          setMerchantWallet(null);
        }
      } catch (error) {
        console.error('Error fetching merchant wallet:', error);
        setMerchantWallet(null);
      } finally {
        setWalletLoading(false);
      }
    };

    checkMerchantWallet();
  }, [businessId]);

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
      merchantWallet,
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
        merchantWallet,
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
        {walletLoading ? (
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 dark:border-white"></div>
            <span className="text-gray-600 dark:text-gray-400">Checking payment options...</span>
          </div>
        ) : !merchantWallet ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Payments not yet available</h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  The merchant has not yet enabled payments for this business. Please contact them directly to complete your order.
                </p>
              </div>
            </div>
          </div>
        ) : (!connected || !publicKey) ? (
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
