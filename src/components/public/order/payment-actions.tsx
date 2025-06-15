import { useState } from 'react';
import { useWalletUi } from '@wallet-ui/react';
import { lamports, address } from 'gill';
import { useTransferSol } from '../account/account-data-access';

interface PaymentProps {
  solTotal: number;
  onSuccess?: (txSignature: string | null) => void;
  onError?: () => void;
  clearCart: () => void;
}

export function PaymentActions({ solTotal, onSuccess, onError, clearCart }: PaymentProps) {
  const { account } = useWalletUi();
  const transferSol = account ? useTransferSol({ address: address(account.address), account }) : null;
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Hardcoded destination wallet for demo (replace with your business wallet)
  const businessWallet = 'Gd5DD65JrQXUALt839cUyr8h42aLUCdveJhLfdMmFLTa';

  const handlePay = async () => {
    if (!account || !transferSol) {
      alert('Conecta tu wallet para pagar.');
      return;
    }
    if (solTotal <= 0) {
      alert('El carrito está vacío.');
      return;
    }
    setPaymentStatus('pending');
    try {
      const lamportsAmount = lamports(BigInt(solTotal));
      const result = await transferSol.mutateAsync({ destination: address(businessWallet), amount: Number(lamportsAmount) });
      setTxSignature(result ?? null);
      setPaymentStatus('success');
      clearCart();
      onSuccess?.(result ?? null);
    } catch (e) {
      setPaymentStatus('error');
      onError?.();
    }
  };

  return (
    <div className="flex gap-2 mt-4">
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
        disabled={paymentStatus === 'pending' || !account}
      >
        {paymentStatus === 'pending' ? 'Pagando...' : 'Rewards'}
      </button>
      {paymentStatus === 'success' && txSignature && (
        <div className="mt-2 text-green-600">
          ¡Pago realizado! <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="underline">Ver transacción</a>
        </div>
      )}
      {paymentStatus === 'error' && (
        <div className="mt-2 text-red-600">Error al procesar el pago.</div>
      )}
    </div>
  );
}
