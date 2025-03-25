export const metadata = {
  title: "Home - Open PRO",
  description: "Page description",
};

import Hero from "@/components/hero-home";
import Workflows from "@/components/workflows";
import Cta from "@/components/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Workflows />
      <Cta />
    </>
  );
}
