import { CartItem } from '@/types/cart';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';

interface SolanaPayParams {
  total: number;
  cart: CartItem[];
  businessWallet: string;
  publicKey: PublicKey | null;
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>;
  connection: Connection;
  onSuccess: (signature: string) => void;
  onError: () => void;
  setPaymentStatus: (status: 'idle' | 'pending' | 'success' | 'error') => void;
  setTxSignature: (sig: string) => void;
  setCartSnapshot: (cart: CartItem[]) => void;
}

export async function handleSolanaPayPayment({
  total,
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
    alert('Connect your wallet to pay.');
    return;
  }
  if (total <= 0) {
    alert('The cart is empty.');
    return;
  }
  setPaymentStatus('pending');
  try {
    const lamportsAmount = Math.round(total * LAMPORTS_PER_SOL);
    const balance = await connection.getBalance(publicKey);
    const feeBuffer = 0.00001 * LAMPORTS_PER_SOL;
    if (balance < lamportsAmount + feeBuffer) {
      setPaymentStatus('idle');
      alert('You don\'t have enough SOL to pay and cover the network fee.');
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
