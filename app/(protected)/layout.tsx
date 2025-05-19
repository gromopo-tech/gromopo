"use client";
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        redirect('/');
      }
      setIsLoading(false);
    });

    return () => unsubscribe(); // Cleanup the listener on unmount
  }, []);

  if (isLoading) {
    // Show a loading state while checking auth
    return <div className="flex items-center justify-center min-h-screen text-black">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect logic is already handled in onAuthStateChanged
    return null;
  }

  return (
    <div className="flex min-h-screen bg-e9e7d5">
      {/* Main Content */}
      <div className="flex-grow overflow-hidden bg-e9e7d5">
        <div className="h-full overflow-auto p-6">
          {children}
        </div>
      </div>
    </div>
  )
}