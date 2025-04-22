'use client';

import React, { createContext, useContext, useState } from 'react';

interface PrintContextType {
  isPrintView: boolean;
  setIsPrintView: (value: boolean) => void;
}

const PrintContext = createContext<PrintContextType | undefined>(undefined);

export function PrintProvider({ children }: { children: React.ReactNode }) {
  const [isPrintView, setIsPrintView] = useState(false);

  return (
    <PrintContext.Provider value={{ isPrintView, setIsPrintView }}>
      {children}
    </PrintContext.Provider>
  );
}

export function usePrint() {
  const context = useContext(PrintContext);
  if (context === undefined) {
    throw new Error('usePrint must be used within a PrintProvider');
  }
  return context;
} 