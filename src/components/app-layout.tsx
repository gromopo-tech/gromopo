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
import { Spinner } from './ui/spinner'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Consider user authenticated only when signed in AND email is verified.
      const verified = !!user && !!(user.emailVerified);
      setIsAuthenticated(verified);
      setAuthLoading(false); // Auth check complete
      if (!user && pathname.startsWith('/dashboard')) {
        router.replace('/signin');
      }
    });
    return () => unsubscribe();
  }, [pathname, router]);

  // Session refresh logic (keep this)
  useEffect(() => {
    const refresh = async () => {
      const user = auth.currentUser;
      // Only refresh server session cookie for verified users.
      if (user && user.emailVerified) {
        const idToken = await user.getIdToken(true);
        await fetch('/api/set-session-cookie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: idToken }),
        });
      }
    };
    const interval = setInterval(refresh, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isDashboardRoute = mounted && pathname?.startsWith("/dashboard");

  // Show loading only while checking authentication
  if (!mounted || authLoading) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <div className="flex flex-col min-h-screen">
          <AppHeader isAuthenticated={false} />
          <div className="flex-grow flex items-center justify-center">
            <Spinner size="md" className="text-base" />
          </div>
        </div>
        <Toaster position="top-right" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex flex-col min-h-screen">
        <AppHeader isAuthenticated={isAuthenticated} />
  <main className={isDashboardRoute ? "flex-grow" : "flex-grow container mx-auto p-4"}>
          {children}
        </main>
        {isAuthenticated ? null : <AppFooter isAuthenticated={isAuthenticated}/>}
      </div>
      <Toaster position="top-right" />
    </ThemeProvider>
  )
}
