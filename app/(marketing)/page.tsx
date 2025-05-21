export const metadata = {
  title: "Home - GroMoPo",
  description: "Growing Mom and Pop Shops",
};

import Hero from "@/components/marketing/hero-home";
//import Workflows from "@/components/marketing/workflows";
import Cta from "@/components/marketing/cta";

export default function Home() {return (
    <>
      <Hero />
      <Cta />
    </>
    
  )
}
