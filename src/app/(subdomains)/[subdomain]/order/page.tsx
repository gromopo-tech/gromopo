import React from 'react';
import { getBusinessBySubdomain, getBusinessMenu } from '@/lib/firebase/business';
import { notFound } from 'next/navigation';
import { OrderPageWrapper } from '@/components/order/order-page-wrapper';
import { getOrderUrl } from '@/lib/utils';

interface OrderPageProps {
  params: Promise<{
    subdomain: string;
  }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { subdomain } = await params;
  const business = await getBusinessBySubdomain(subdomain);
  
  if (!business) {
    notFound();
  }

  const menuData = await getBusinessMenu(business.id);

  // Construct the order URL for the mobile wallet selector
  const orderUrl = getOrderUrl(subdomain);

  return (
    <OrderPageWrapper 
      business={business}
      menuData={menuData}
      orderUrl={orderUrl}
    />
  );
}
