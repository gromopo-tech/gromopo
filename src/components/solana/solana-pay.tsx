"use client";

import { useEffect, useState } from 'react';
import { Keypair } from '@solana/web3.js';
import { generateSolanaPayUrl, pollSolanaPayPayment } from '@/lib/solanaPay/config';

interface SolanaPayProps {
  total: number;
  customerName: string;
  businessName: string | null;
  merchantWallet: string | null;
  onConfirmed: (reference: string) => void;
}

export function SolanaPay({
  total,
  customerName,
  businessName,
  merchantWallet,
  onConfirmed,
}: SolanaPayProps) {
  const [solanaPayUrl, setSolanaPayUrl] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'confirmed' | 'none'>('none');
  const [reference, setReference] = useState<string>('');

  // Generate Solana Pay URL
  useEffect(() => {
    if (
      total > 0 &&
      customerName &&
      merchantWallet &&
      merchantWallet.length > 0
    ) {
      const refKey = Keypair.generate().publicKey.toBase58();
      setReference(refKey);
      const url = generateSolanaPayUrl({
        recipient: merchantWallet,
        amount: total,
        reference: refKey,
        label: businessName || 'Unknown Business',
        message: `Order for ${customerName}`,
      });
      setSolanaPayUrl(url);
      setPaymentStatus('pending');
    } else {
      setSolanaPayUrl('');
      setReference('');
      setPaymentStatus('none');
    }
  }, [total, customerName, businessName, merchantWallet]);

  // Poll for payment
  useEffect(() => {
    let stop = false;
    if (
      paymentStatus === 'pending' &&
      reference &&
      merchantWallet &&
      merchantWallet.length > 0 &&
      total > 0
    ) {
      (async () => {
        let retries = 0;
        let delay = 1000;
        const maxRetries = 10;
        while (!stop && retries < maxRetries) {
          try {
            const confirmed = await pollSolanaPayPayment({
              reference,
              amount: total,
              recipient: merchantWallet,
              timeout: 10,
              interval: 500,
            });
            if (confirmed) {
              setPaymentStatus('confirmed');
              onConfirmed(reference);
              return;
            }
          } catch (err) {
            console.error('Error polling Solana Pay payment:', err);
            delay = 1000;
          }
          retries++;
          await new Promise(res => setTimeout(res, delay));
        }
        if (!stop) {
          setPaymentStatus('none');
          alert('Payment not detected. Please ensure your wallet supports Solana Pay reference and try again.');
        }
      })();
    }
    return () => { stop = true; };
  }, [paymentStatus, reference, total, merchantWallet, onConfirmed]);

  let qrError: string | null = null;
  if (!merchantWallet || merchantWallet.length === 0) {
    qrError = 'Merchant wallet not set. Please check business settings.';
  } else if (total <= 0) {
    qrError = 'Total must be greater than 0.';
  }

  return (
    <div className="mb-2">
      {solanaPayUrl && !qrError ? (
        <img 
          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(solanaPayUrl)}`} 
          alt="Solana Pay QR Code" 
          width={180}
          height={180}
          className="mx-auto"
        />
      ) : (
        <div className="text-red-600 font-semibold min-h-[180px] flex items-center justify-center border border-dashed border-red-300 bg-red-50 rounded">
          {qrError || 'QR code cannot be generated.'}
        </div>
      )}
      {paymentStatus === 'pending' && solanaPayUrl && !qrError && (
        <div className="text-yellow-600 font-semibold">Esperando confirmación de pago...</div>
      )}
      {paymentStatus === 'confirmed' && (
        <div className="text-green-600 font-semibold">¡Pago confirmado!</div>
      )}
    </div>
  );
}
