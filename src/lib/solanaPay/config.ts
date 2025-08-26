import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
import type { Cluster } from '@solana/web3.js';

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

// Export the USDC mint address for use in other files
export const USDC_MINT = USDC_MINT_ADDRESS;
