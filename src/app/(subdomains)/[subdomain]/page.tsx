import { getBusinessBySubdomain } from '@/lib/firebase/business';
import { notFound, redirect } from 'next/navigation';

interface SubdomainPageProps {
  params: Promise<{
    subdomain: string;
  }>;
}

export default async function SubdomainPage({ params }: SubdomainPageProps) {
  const { subdomain } = await params;
  const business = await getBusinessBySubdomain(subdomain);
  
  if (!business) {
    notFound();
  }

  // Redirect to the order page with the correct subdomain path
  redirect(`/order`);
}
