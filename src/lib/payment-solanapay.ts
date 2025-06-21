import { CartItem } from '@/types/cart';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

interface SolanaPayParams {
  solTotal: number;
  cart: CartItem[];
  businessWallet: string;
  publicKey: any;
  sendTransaction: any;
  connection: any;
  onSuccess: (signature: string) => void;
  onError: () => void;
  setPaymentStatus: (status: 'idle' | 'pending' | 'success' | 'error') => void;
  setTxSignature: (sig: string) => void;
  setCartSnapshot: (cart: CartItem[]) => void;
}

export async function handleSolanaPayPayment({
  solTotal,
  cart,
  businessWallet,
  publicKey,
  sendTransaction,
  connection,
  onSuccess,
  onError,
  setPaymentStatus,
  setTxSignature,
  setCartSnapshot,
}: SolanaPayParams) {
  if (!publicKey) {
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
    setCartSnapshot(cart);
    setPaymentStatus('success');
    onSuccess(signature);
  } catch {
    setPaymentStatus('error');
    onError();
  }
}
