export const metadata = {
  title: "Home - GroMoPo",
  description: "",
};

import Hero from "@/components/public/hero-home";
import Cta from "@/components/public/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Cta />
    </>
  );
}
