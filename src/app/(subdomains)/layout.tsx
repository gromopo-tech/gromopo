import React from "react";
import { AppHeaderSubdomain } from '@/components/app-header-subdomain';

export default function SubdomainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeaderSubdomain />
      {children}
    </>
  );
}