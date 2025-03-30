export const metadata = {
  title: "Home - Open PRO",
  description: "Page description",
};

import Hero from "@/components/marketing/home";
import Workflows from "@/components/marketing/workflows";
import Cta from "@/components/marketing/cta";
import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth0.getSession();

  if (!session) {
    return (
        <>
          <Hero />
          <Workflows />
          <Cta />
        </>
      );
  } else {
    // Redirect to the dashboard landing page
    redirect("/dashboard");
  }
}