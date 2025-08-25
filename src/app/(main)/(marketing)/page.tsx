export const metadata = {
  title: "Home - GroMoPo",
  description: "",
};

import Hero from "@/components/marketing/hero-home";
import Features from "@/components/marketing/features";
import Cta from "@/components/marketing/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Cta />
    </>
  );
}
