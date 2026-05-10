'use client';

/**
 * Thin client for the Vouched on-chain review program.
 *
 * The `reviewee` argument is the merchant's Solana wallet address.
 * PDA seeds: [reviewee, reviewer] — one review per wallet per restaurant.
 *
 * Story: customer submits on-chain → the next batch ingest run in the chat
 * service picks it up and upserts it into Qdrant. This is intentional batch
 * design, not a limitation.
 */

import { useCallback, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { AnchorProvider, Program, BN } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import VouchedIDL from './vouched-idl.json';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VouchedIDLType = typeof VouchedIDL & { version: string; name: string };

const PROGRAM_ID = new PublicKey(VouchedIDL.address);

export type ReviewStatus = 'idle' | 'checking' | 'submitting' | 'success' | 'error' | 'already_reviewed';

export interface UseAddReviewResult {
  status: ReviewStatus;
  txSignature: string | null;
  errorMessage: string | null;
  checkAlreadyReviewed: (merchantWallet: string) => Promise<boolean>;
  submitReview: (merchantWallet: string, comment: string, rating: number) => Promise<void>;
  updateReview: (merchantWallet: string, comment: string, rating: number) => Promise<void>;
}

export function useAddReview(): UseAddReviewResult {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [status, setStatus] = useState<ReviewStatus>('idle');
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getProgram = useCallback(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    const wallet = { publicKey, signTransaction, signAllTransactions };
    const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
    return new Program(VouchedIDL as VouchedIDLType, provider);
  }, [publicKey, signTransaction, signAllTransactions, connection]);

  const deriveReviewPda = useCallback(
    (merchantWallet: string): PublicKey => {
      if (!publicKey) throw new Error('Wallet not connected');
      const reviewee = new PublicKey(merchantWallet);
      const [pda] = PublicKey.findProgramAddressSync(
        [reviewee.toBuffer(), publicKey.toBuffer()],
        PROGRAM_ID,
      );
      return pda;
    },
    [publicKey],
  );

  const checkAlreadyReviewed = useCallback(
    async (merchantWallet: string): Promise<boolean> => {
      if (!publicKey) return false;
      try {
        const pda = deriveReviewPda(merchantWallet);
        const accountInfo = await connection.getAccountInfo(pda);
        return accountInfo !== null;
      } catch {
        return false;
      }
    },
    [publicKey, connection, deriveReviewPda],
  );

  const submitReview = useCallback(
    async (merchantWallet: string, comment: string, rating: number) => {
      const program = getProgram();
      if (!program || !publicKey) {
        setStatus('error');
        setErrorMessage('Wallet not connected');
        return;
      }

      setStatus('checking');
      const alreadyReviewed = await checkAlreadyReviewed(merchantWallet);
      if (alreadyReviewed) {
        setStatus('already_reviewed');
        return;
      }

      try {
        setStatus('submitting');
        const reviewee = new PublicKey(merchantWallet);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sig = await (program.methods as any)
          .addReview(reviewee, comment, rating)
          .accounts({ reviewer: publicKey })
          .rpc();
        setTxSignature(sig);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Transaction failed');
      }
    },
    [getProgram, publicKey, checkAlreadyReviewed],
  );

  const updateReview = useCallback(
    async (merchantWallet: string, comment: string, rating: number) => {
      const program = getProgram();
      if (!program || !publicKey) {
        setStatus('error');
        setErrorMessage('Wallet not connected');
        return;
      }
      try {
        setStatus('submitting');
        const reviewee = new PublicKey(merchantWallet);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sig = await (program.methods as any)
          .updateReview(reviewee, comment, rating)
          .accounts({ reviewer: publicKey })
          .rpc();
        setTxSignature(sig);
        setStatus('success');
      } catch (err) {
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Transaction failed');
      }
    },
    [getProgram, publicKey],
  );

  return { status, txSignature, errorMessage, checkAlreadyReviewed, submitReview, updateReview };
}

// Re-export BN so callers don't need to import from anchor directly
export { BN };
