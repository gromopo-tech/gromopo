import React from "react";
import { HomeRedirectIfAuthenticated } from "@/components/marketing/home-redirect-if-auth";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <HomeRedirectIfAuthenticated>{children}</HomeRedirectIfAuthenticated>;
}