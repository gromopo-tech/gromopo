"use client";
import React, { createContext, useState, useEffect } from "react";
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export const BusinessIdContext = createContext<string | null>(null);
export const RoleContext = createContext<string | null>(null);
export const BusinessNameContext = createContext<string | null>(null);

export function BusinessIdContextProvider({ businessId, children }: { businessId: string | null, children: React.ReactNode }) {
  return <BusinessIdContext.Provider value={businessId}>{children}</BusinessIdContext.Provider>;
}

export function RoleContextProvider({ role, children }: { role: string | null, children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function BusinessNameContextProvider({ businessId, children }: { businessId: string | null, children: React.ReactNode }) {
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
