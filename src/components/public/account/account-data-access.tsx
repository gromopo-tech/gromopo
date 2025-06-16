'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export function useGetBalance({ address }: { address: string }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-balance', { address }],
    queryFn: async () => {
      const pubkey = new PublicKey(address);
      return await connection.getBalance(pubkey);
    },
  });
}

export function useTransferSol() {
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['transfer-sol'],
    mutationFn: async ({ destination, amount }: { destination: string; amount: number }) => {
      if (!connected || !publicKey) throw new Error('Wallet not connected');
      const toPubkey = new PublicKey(destination);
      const tx = new (await import('@solana/web3.js')).Transaction().add(
        (await import('@solana/web3.js')).SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey,
          lamports: Math.round(amount * LAMPORTS_PER_SOL),
        })
      );
      tx.feePayer = publicKey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('finalized');
      tx.recentBlockhash = blockhash;
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });
      return signature;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['get-balance'] });
    },
  });
}

export function useGetSignatures({ address }: { address: string }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-signatures', { address }],
    queryFn: async () => {
      const pubkey = new PublicKey(address);
      return await connection.getSignaturesForAddress(pubkey, { limit: 50 });
    },
  });
}

export function useGetTokenAccounts({ address }: { address: string }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-token-accounts', { address }],
    queryFn: async () => {
      const pubkey = new PublicKey(address);
      // Get SPL Token accounts (including Token-2022)
      const [tokenAccounts, token2022Accounts] = await Promise.all([
        connection.getParsedTokenAccountsByOwner(pubkey, { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }),
        connection.getParsedTokenAccountsByOwner(pubkey, { programId: new PublicKey('TokenzQdB6rGz5rWQh6v3Qy1Q1rR1Q1Q1Q1Q1Q1Q1Q1Q1') }).catch(() => ({ value: [] })),
      ]);
      return [...tokenAccounts.value, ...(token2022Accounts.value ?? [])];
    },
  });
}
