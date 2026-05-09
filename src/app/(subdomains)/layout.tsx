import React from "react";
import { HomeRedirectIfAuthenticated } from "@/components/marketing/home-redirect-if-auth";
import { AppHeaderSubdomain } from '@/components/app-header-subdomain';

export default function SubdomainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeaderSubdomain />
      {children}
    </>
  );
}