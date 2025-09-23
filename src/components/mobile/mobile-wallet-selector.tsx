'use client';

import { Button } from '@/components/ui/button';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface MobileWalletSelectorProps {
  orderUrl: string;
  onWalletSelected?: () => void;
}

interface WalletOption {
  name: string;
  deepLinkScheme: string;
  urlParameter: string;
  useCustomFormat?: boolean; // New flag for wallets that use custom URL formats
  icon: string;
  color: string;
}

const SUPPORTED_WALLETS: WalletOption[] = [
  {
    name: 'Solflare',
    deepLinkScheme: 'solflare://ul/v1/browse',
    urlParameter: 'ref',
    useCustomFormat: true,
    icon: '🔥',
    color: 'bg-orange-600 hover:bg-orange-700',
  },
  {
    name: 'Phantom',
    deepLinkScheme: 'phantom://browse',
    urlParameter: 'ref',
    useCustomFormat: true,
    icon: '👻',
    color: 'bg-purple-600 hover:bg-purple-700',
  },
  {
    name: 'Backpack',
    deepLinkScheme: 'backpack://open',
    urlParameter: 'url',
    icon: '🎒',
    color: 'bg-black hover:bg-gray-800',
  },
  {
    name: 'MetaMask',
    deepLinkScheme: 'metamask://browse',
    urlParameter: 'url',
    icon: '🦊',
    color: 'bg-orange-500 hover:bg-orange-600',
  },
  {
    name: 'Exodus',
    deepLinkScheme: 'exodus://browse',
    urlParameter: 'url',
    icon: '🚀',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
];

export function MobileWalletSelector({ orderUrl }: MobileWalletSelectorProps) {
  const isMobile = useMobileDetection();

  const handleWalletClick = (wallet: WalletOption) => {
    if (!wallet.useCustomFormat) {
      console.log(`${wallet.name} deep linking coming soon...`);
      return;
    }

    try {
      let deepLinkUrl: string;
      
      if (wallet.useCustomFormat && (wallet.name === 'Solflare' || wallet.name === 'Phantom')) {
        const url = new URL(orderUrl);
        url.searchParams.set('wallet-redirect', 'true');
        
        if (wallet.name === 'Phantom') {
          // Phantom requires a different URL structure
          deepLinkUrl = `${wallet.deepLinkScheme}/${encodeURIComponent(url.toString())}`;
        } else {
          // Solflare format remains the same
          const hostAndPath = `${url.hostname}${encodeURIComponent(url.pathname + url.search)}`;
          deepLinkUrl = `${wallet.deepLinkScheme}/${hostAndPath}?${wallet.urlParameter}=gromopo.com`;
        }
      } else {
        const targetUrl = new URL(orderUrl);
        targetUrl.searchParams.set('wallet-redirect', 'true');
        deepLinkUrl = `${wallet.deepLinkScheme}?${wallet.urlParameter}=${encodeURIComponent(targetUrl.toString())}`;
      }
      
      // Open the wallet without redirecting the current page
      window.open(deepLinkUrl, '_blank');
      
    } catch (error) {
      console.error(`Failed to open ${wallet.name} wallet:`, error);
    }
  };

  // Don't show selector if we're being redirected from a wallet
  const isWalletRedirect = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).has('wallet-redirect');
  
  // Don't show wallet selector on non-mobile devices or wallet redirects
  if (!isMobile || isWalletRedirect) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Choose Your Wallet
          </h1>
          <p className="text-gray-600">
            Select a Solana wallet to open this ordering page
          </p>
        </div>

        <div className="space-y-3">
          {SUPPORTED_WALLETS.map((wallet) => (
            <div key={wallet.name} className="relative">
              <Button
                onClick={() => handleWalletClick(wallet)}
                className={`w-full h-14 text-white font-medium text-lg flex items-center justify-center space-x-3 rounded-lg transition-colors ${
                  wallet.useCustomFormat 
                    ? wallet.color 
                    : 'bg-gray-400 hover:bg-gray-500 cursor-not-allowed'
                }`}
                disabled={!wallet.useCustomFormat}
              >
                <span className="text-2xl">{wallet.icon}</span>
                <span>Open in {wallet.name}</span>
              </Button>
              {!wallet.useCustomFormat && (
                <div className="absolute -bottom-1 right-2">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    Coming Soon
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            For security, orders can only be placed from within a wallet app's browser.
          </p>
        </div>
      </div>
    </div>
  );
}
