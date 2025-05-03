"use client";
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import Sidebar from "@/components/dashboard/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        redirect('/dashboard');
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup the listener on unmount
  }, []);

  if (isLoading) {
    // Show a loading state while checking auth
    return <div className="flex items-center justify-center min-h-screen text-black">Loading...</div>;
  }

  return (
        <div className="h-full overflow-auto p-6">
          {children}
        </div>
  )
}