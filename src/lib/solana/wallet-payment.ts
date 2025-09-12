import { CartItem } from '@/types/cart';
import { Transaction, PublicKey, Connection } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import { USDC_MINT } from './config'; // Import from config

interface SolanaPayParams {
  total: number;
  cart: CartItem[];
  merchantWallet: string | null;
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
  merchantWallet,
  publicKey,
  sendTransaction,
  connection,
  onSuccess,
  onError,
  setPaymentStatus,
  setTxSignature,
  setCartSnapshot,
}: SolanaPayParams) {
  setPaymentStatus('pending');
  try {
    // Convert USDC amount (6 decimals)
    const usdcAmount = Math.round(total * 1000000);
    
    // Get associated token addresses
    const fromTokenAccount = await getAssociatedTokenAddress(USDC_MINT, publicKey!);
    const toTokenAccount = merchantWallet ? await getAssociatedTokenAddress(USDC_MINT, new PublicKey(merchantWallet)) : null;
    if (!toTokenAccount) throw new Error('Merchant wallet not configured');
    
    // Create USDC transfer transaction
    const tx = new Transaction().add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        publicKey!,
        usdcAmount
      )
    );
    
    tx.feePayer = publicKey!;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
    tx.recentBlockhash = blockhash;
    
    const signature = await sendTransaction(tx, connection);
    await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
    
    setTxSignature(signature);
    setCartSnapshot(cart);
    setPaymentStatus('success');
    onSuccess(signature);
  } catch (error) {
    console.error('Payment error:', error);
    setPaymentStatus('error');
    onError();
  }
}
