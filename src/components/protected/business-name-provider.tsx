"use client";
import React, { createContext, useState, useEffect } from "react";
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export const BusinessNameContext = createContext<string | null>(null);

export function BusinessNameProvider({ businessId, children }: { businessId: string | null, children: React.ReactNode }) {
  const [businessName, setBusinessName] = useState<string | null>(null);
  useEffect(() => {
    if (businessId) {
      const cached = sessionStorage.getItem(`businessName-${businessId}`);
      if (cached) {
        setBusinessName(cached);
      } else {
        getDoc(doc(db, 'businesses', businessId)).then((snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const name = typeof data.name === 'string' ? data.name : '';
            if (name) {
              setBusinessName(name);
              sessionStorage.setItem(`businessName-${businessId}`, name);
              // Since businessId is now the subdomain, use it directly
              sessionStorage.setItem(`businessSubdomain-${businessId}`, businessId);
            }
          }
        }).catch(console.error);
      }
    } else {
      setBusinessName(null);
    }
  }, [businessId]);
  return <BusinessNameContext.Provider value={businessName}>{children}</BusinessNameContext.Provider>;
}