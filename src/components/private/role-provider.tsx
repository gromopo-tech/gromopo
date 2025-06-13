"use client";
import React, { createContext } from "react";

export const RoleContext = createContext<string | null>(null);

export function RoleProvider({ role, children }: { role: string | null, children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}