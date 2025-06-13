"use client";
import React, { createContext, useState, useEffect } from "react";
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export const BusinessNameContext = createContext<string | null>(null);

export function BusinessNameProvider({ businessId, children }: { businessId: string | null, children: React.ReactNode }) {
  const [businessName, setBusinessName] = useState<string | null>(null);
  useEffect(() => {
    let isMounted = true;
    if (businessId) {
      const cached = sessionStorage.getItem(`businessName-${businessId}`);
      if (cached) {
        setBusinessName(cached);
      } else {
        getDoc(doc(db, 'businesses', businessId)).then((snap) => {
          if (isMounted && snap.exists()) {
            // Try both 'name' and 'businessName' fields for compatibility
            const name = snap.data().businessName || '';
            setBusinessName(name);
            sessionStorage.setItem(`businessName-${businessId}`, name);
          }
        });
      }
    } else {
      setBusinessName(null);
    }
    return () => { isMounted = false; };
  }, [businessId]);
  return <BusinessNameContext.Provider value={businessName}>{children}</BusinessNameContext.Provider>;
}