'use client'

import React, { FC, ReactNode, useMemo, useEffect, useState, } from "react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import dynamic from 'next/dynamic'
import { ConnectionProvider, WalletProvider, } from '@solana/wallet-adapter-react'
import { WalletModalProvider, } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'

export const WalletButton = dynamic(
  async () => {
    const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui');
    return function WalletButtonClientOnly(props: React.ComponentProps<typeof WalletMultiButton>) {
      const [mounted, setMounted] = useState(false);
      useEffect(() => setMounted(true), []);
      if (!mounted) return null;
      return <WalletMultiButton {...props} />;
    }
  },
  { ssr: false }
)

interface SolanaProviderProps {
  children: ReactNode;
}

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect onError={(error) => {
          // Auto-connect rejections are expected when no wallet is active — suppress console noise.
          if (error.name !== 'WalletConnectionError') console.error(error);
        }}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
