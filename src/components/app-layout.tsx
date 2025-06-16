'use client'

import { useEffect, useState } from "react";
import { usePathname, useRouter } from 'next/navigation';
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { ThemeProvider } from './theme-provider'
import { Toaster } from './ui/sonner'
import { AppHeader } from '@/components/app-header'
import React from 'react'
import { AppFooter } from '@/components/app-footer'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (!user && pathname.startsWith('/dashboard')) {
        router.replace('/signin');
      }
    });
    return () => unsubscribe();
  }, [pathname, router]);

  // TODO: Reconsider refresh logic
  useEffect(() => {
    const refresh = async () => {
      const user = auth.currentUser;
      if (user) {
        const idToken = await user.getIdToken(true); // force refresh
        await fetch('/api/set-session-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken }),
        });
      }
    };
    // Refresh every 50 minutes
    const interval: NodeJS.Timeout = setInterval(refresh, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex flex-col min-h-screen">
        <AppHeader isAuthenticated={isAuthenticated} />
        <main className="flex-grow container mx-auto p-4">
          {children}
        </main>
        <AppFooter />
      </div>
      <Toaster position="top-right" />
    </ThemeProvider>
  )
}
