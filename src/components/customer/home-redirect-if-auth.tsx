"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export function HomeRedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
      } else {
        setChecked(true);
      }
    });
    return () => unsubscribe();
  }, [router]);
  if (!checked) return null; // Prevent flicker
  return <>{children}</>;
}
