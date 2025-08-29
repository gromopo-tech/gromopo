import React from 'react';
import { getBusinessBySubdomain, getBusinessMenu } from '@/lib/firebase/business';
import { notFound } from 'next/navigation';
import DynamicOrderPage from './dynamic-order-page';

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

  return (
    <DynamicOrderPage 
      business={business}
      menuData={menuData}
    />
  );
}
