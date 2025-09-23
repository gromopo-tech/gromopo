'use client';

import { useMobileDetection } from '@/hooks/useMobileDetection';
import { MobileWalletSelector } from '@/components/mobile/mobile-wallet-selector';
import { BusinessData, MenuData } from '@/types/business';
import dynamic from 'next/dynamic';

// Dynamically import the Order component to avoid server/client mismatch
const Order = dynamic(() => import('@/app/(subdomains)/[subdomain]/order/order'), {
  ssr: false,
});

interface OrderPageWrapperProps {
  business: BusinessData;
  menuData: MenuData;
  orderUrl: string;
}

export function OrderPageWrapper({ business, menuData, orderUrl }: OrderPageWrapperProps) {
  const isMobile = useMobileDetection();
  const isWalletRedirect = typeof window !== 'undefined' && 
    new URLSearchParams(window.location.search).has('wallet-redirect');

  // If on mobile and not redirected from wallet, show only the wallet selector
  if (isMobile && !isWalletRedirect) {
    return <MobileWalletSelector orderUrl={orderUrl} />;
  }

  // Otherwise show the order page
  return (
    <Order 
      business={business}
      menuData={menuData}
      orderUrl={orderUrl}
    />
  );
}