export const metadata = {
  title: "Home - GroMoPo",
  description: "",
};

import Hero from "@/components/marketing/hero-home";
//import Workflows from "@/components/marketing/workflows";
import Cta from "@/components/marketing/cta";
import { HomeRedirectIfAuthenticated } from '@/components/marketing/home-redirect-if-auth';

export default function Home() {
  return (
    <HomeRedirectIfAuthenticated>
      <Hero />
      <Cta />
    </HomeRedirectIfAuthenticated>
  );
}
