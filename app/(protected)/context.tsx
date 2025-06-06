"use client";
import React, { createContext } from "react";

export const BusinessIdContext = createContext<string | null>(null);
export const RoleContext = createContext<string | null>(null);

export function BusinessIdContextProvider({ businessId, children }: { businessId: string | null, children: React.ReactNode }) {
  return <BusinessIdContext.Provider value={businessId}>{children}</BusinessIdContext.Provider>;
}

export function RoleContextProvider({ role, children }: { role: string | null, children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}
