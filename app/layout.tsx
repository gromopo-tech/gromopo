"use client";

import "./css/style.css";
import localFont from "next/font/local";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import MarketingHeader from "@/components/marketing/ui/header";
import ProtectedHeader from "@/components/protected/ui/header";
import MarketingFooter from "@/components/marketing/ui/footer";
import ProtectedFooter from "@/components/protected/ui/footer";
import { Toaster } from "react-hot-toast";

const nacelle = localFont({
  src: [
    {
      path: "../public/fonts/nacelle-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/nacelle-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/nacelle-semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/nacelle-semibolditalic.woff2",
      weight: "600",
      style: "italic",
    },
  ],
  variable: "--font-nacelle",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user); // Set authentication state
    });

    return () => unsubscribe(); // Cleanup the listener on unmount
  }, []);

  return (
    <html lang="en">
      <body
        className={`${nacelle.variable} bg-e9e7d5 font-inter text-base text-black-200 antialiased`}
      >
        <Toaster position="top-right" />
        {isAuthenticated ? <ProtectedHeader /> : <MarketingHeader />}
        <main className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
          {children}
        </main>
        {isAuthenticated ? <ProtectedFooter /> : <MarketingFooter />}
      </body>
    </html>
  );
}