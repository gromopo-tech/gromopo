"use client";

import { useEffect } from "react";

import AOS from "aos";
import "aos/dist/aos.css";

import Header from "@/components/marketing/ui/header";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    AOS.init({
      once: true,
      disable: "phone",
      duration: 600,
      easing: "ease-out-sine",
    });
  });

  return (
    <>
      <Header />
      <main className="relative flex grow flex-col">{children}</main>
    </>
  );
}