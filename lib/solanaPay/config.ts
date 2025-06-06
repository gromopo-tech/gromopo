import { Keypair, PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import { encodeURL, findReference, validateTransfer } from '@solana/pay';
import BigNumber from 'bignumber.js';

// Use environment variables for network and merchant wallet, with dev/prod logic
let SOLANA_NETWORK: string;
let USDC_MINT_ADDRESS: PublicKey;

if (process.env.NODE_ENV === 'development') {
  SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
  USDC_MINT_ADDRESS = new PublicKey(process.env.NEXT_PUBLIC_SOLANA_USDC_MINT_ADDRESS || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'); // Default to devnet USDC mint address
} else {
  SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'mainnet-beta';
  USDC_MINT_ADDRESS = new PublicKey(process.env.NEXT_PUBLIC_SOLANA_USDC_MINT_ADDRESS || 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // Default to mainnet-beta USDC mint address
}

export function getSolanaConnection() {
  return { connection: new Connection(clusterApiUrl(SOLANA_NETWORK as any)), mint: USDC_MINT_ADDRESS };
}

export function generateSolanaPayUrl({
  recipient,
  amount,
  reference,
  label,
  message,
  memo,
}: {
  recipient: string;
  amount: number;
  reference: string;
  label?: string;
  message?: string;
  memo?: string;
}) {
  let referenceKey: PublicKey;
  try {
    referenceKey = new PublicKey(reference);
  } catch (e) {
    referenceKey = Keypair.generate().publicKey;
  }
  const { mint } = getSolanaConnection();
  const url = encodeURL({
    recipient: new PublicKey(recipient),
    amount: new BigNumber(amount),
    splToken: mint,
    reference: [referenceKey],
    label,
    message,
    memo,
  });
  return url.toString();
}

export async function pollSolanaPayPayment({
  reference,
  amount,
  recipient,
  timeout = 60,
  interval = 2000,
}: {
  reference: string;
  amount: number;
  recipient: string;
  timeout?: number;
  interval?: number;
}): Promise<boolean> {
  const { connection, mint } = getSolanaConnection();
  let refKey: PublicKey;
  try {
    refKey = new PublicKey(reference);
  } catch (e) {
    refKey = Keypair.generate().publicKey;
  }
  const recipientKey = new PublicKey(recipient);
  const start = Date.now();
  while (Date.now() - start < timeout * 1000) {
    try {
      // Use 'confirmed' for faster detection (supported by Solana web3.js)
      const signatureInfo = await findReference(connection, refKey, { finality: 'confirmed' });
      // Use BigNumber for USDC with 6 decimals
      await validateTransfer(connection, signatureInfo.signature, {
        recipient: recipientKey,
        amount: new BigNumber(amount),
        splToken: mint,
        reference: refKey,
      });
      return true;
    } catch (e) {
      // Not found or not validated yet
    }
    await new Promise(res => setTimeout(res, interval));
  }
  return false;
}
