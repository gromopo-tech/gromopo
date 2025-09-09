import { PublicKey } from '@solana/web3.js';

/**
 * Validates if a string is a valid Solana public key address
 * @param address - The address string to validate
 * @returns boolean - true if valid, false otherwise
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a Solana address for display (shortened version)
 * @param address - The full address
 * @param chars - Number of characters to show at start and end (default 4)
 * @returns Formatted address like "7xKX...sgAs"
 */
export function formatSolanaAddress(address: string, chars: number = 4): string {
  if (!address || address.length <= chars * 2) {
    return address;
  }
  
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Normalizes a Solana address by trimming whitespace
 * @param address - The address to normalize
 * @returns Normalized address
 */
export function normalizeSolanaAddress(address: string): string {
  return address.trim();
}
