export const metadata = {
  title: "Home - GroMoPo",
  description: "",
};

import Hero from "@/components/customer/hero-home";
import Cta from "@/components/customer/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Cta />
    </>
  );
}
