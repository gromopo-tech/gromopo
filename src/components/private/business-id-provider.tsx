"use client";
import React, { createContext } from "react";

export const BusinessIdContext = createContext<string | null>(null);

export function BusinessIdProvider({ businessId, children }: { businessId: string | null, children: React.ReactNode }) {
  return <BusinessIdContext.Provider value={businessId}>{children}</BusinessIdContext.Provider>;
}

