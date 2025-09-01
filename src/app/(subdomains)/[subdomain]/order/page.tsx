import React from 'react';
import { getBusinessBySubdomain, getBusinessMenu } from '@/lib/firebase/business';
import { notFound } from 'next/navigation';
import Order from './order';

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
    <Order 
      business={business}
      menuData={menuData}
    />
  );
}
