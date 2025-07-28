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
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [currentPathname, setCurrentPathname] = useState(pathname);
  
  useEffect(() => { setMounted(true); }, []);
  
  // Track page transitions
  useEffect(() => {
    if (pathname !== currentPathname) {
      // Start a timer to show loading after a delay
      const showLoadingTimer = setTimeout(() => {
        setIsPageLoading(true);
      }, 100); // Only show loading if transition takes >100ms
    
      // Update state when page finishes loading
      const finishLoadingTimer = setTimeout(() => {
        setIsPageLoading(false);
        setCurrentPathname(pathname);
      }, 300);
    
      return () => {
        clearTimeout(showLoadingTimer);
        clearTimeout(finishLoadingTimer);
      };
    }
  }, [pathname, currentPathname]);

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

  const isDashboardRoot = mounted && pathname === "/dashboard";

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="flex flex-col min-h-screen">
        <AppHeader isAuthenticated={isAuthenticated} />
        {isPageLoading ? (
          <div className="flex-grow flex items-center justify-center">
            <Spinner size="md" className="text-base" />
          </div>
        ) : (
          <main className={isDashboardRoot ? "flex-grow" : "flex-grow container mx-auto p-4"}>
            {children}
          </main>
        )}
        {isAuthenticated ? null : <AppFooter isAuthenticated={isAuthenticated}/>}
      </div>
      <Toaster position="top-right" />
    </ThemeProvider>
  )
}
