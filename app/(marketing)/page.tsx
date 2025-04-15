export const metadata = {
  title: "Home - Open PRO",
  description: "Page description",
};

import Hero from "@/components/marketing/hero-home";
import Workflows from "@/components/marketing/workflows";
import Cta from "@/components/marketing/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Workflows />
      <Cta />
    </>
  );
}
