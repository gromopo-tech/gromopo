"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import MarketingHeader from "@/components/marketing/ui/header";
import ProtectedHeader from "@/components/protected/ui/header";
import MarketingFooter from "@/components/marketing/ui/footer";
import ProtectedFooter from "@/components/protected/ui/footer";
import { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function AppShell({ children, nacelle }: { children: React.ReactNode; nacelle: any }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
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
    interval = setInterval(refresh, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      {isAuthenticated ? <ProtectedHeader /> : <MarketingHeader />}
      <main className="flex flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
        {children}
      </main>
      {isAuthenticated ? <ProtectedFooter /> : <MarketingFooter />}
    </>
  );
}
