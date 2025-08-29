import React from 'react';
import { getBusinessBySubdomain } from '@/lib/firebase/business';
import { notFound } from 'next/navigation';

interface SubdomainLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    subdomain: string;
  }>;
}

export default async function SubdomainLayout({
  children,
  params,
}: SubdomainLayoutProps) {
  const { subdomain } = await params;
  const business = await getBusinessBySubdomain(subdomain);
  
  if (!business) {
    notFound();
  }

  const primaryColor = business.theme?.primaryColor || 'yellow';
  //const secondaryColor = business.theme?.secondaryColor || 'yellow';
  
  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic header based on business data */}
      <header className={`bg-${primaryColor}-50 border-b border-${primaryColor}-200 p-4`}>
        <div className="max-w-6xl mx-auto">
          <h1 className={`text-2xl font-bold text-${primaryColor}-800`}>{business.name}</h1>
          {business.description && (
            <p className={`text-${primaryColor}-600`}>{business.description}</p>
          )}
        </div>
      </header>
      
      <main className="min-h-[calc(100vh-120px)]">
        {children}
      </main>
      
      {/* Dynamic footer */}
      <footer className={`bg-${primaryColor}-50 border-t border-${primaryColor}-200 p-4 text-center text-${primaryColor}-600`}>
        <p>&copy; 2025 {business.name} - Powered by GroMoPo</p>
      </footer>
    </div>
  );
}
