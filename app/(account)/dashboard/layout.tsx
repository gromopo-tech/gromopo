"use client";
import { useEffect, useState } from 'react';
import { redirect, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import Sidebar from "@/components/dashboard/ui/sidebar";
import { PrintProvider, usePrint } from "@/app/contexts/PrintContext";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { isPrintView } = usePrint();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        redirect('/');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-black">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen">
      {!isPrintView && <Sidebar />}
      <main className="flex-1 overflow-y-auto bg-gray-50 px-6 py-8">
        {children}
      </main>
    </div>
  );
}

// Wrap the layout with the PrintProvider
export default function WrappedDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PrintProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </PrintProvider>
  );
}