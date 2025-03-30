export const metadata = {
  title: "Dashboard - Open PRO",
  description: "Page description",
};

import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function Home() {
  // Get the session from Auth0
  const session = await auth0.getSession();
  // Check if the session exists
  if (!session) {
    // Redirect to the login page
    redirect("/");
  }
    else { 
      // If the session exists, render the dashboard page
      // You can also fetch user data from your database here if needed
      // const user = await getUserData(session.user.sub);
      // For now, we'll just display a welcome message with the user's name
      return (
        <div className="pb-12 text-center md:py-20">
          
          <h1 className="md:text-4xl text-orange-900">Welcome {session.user.name}!</h1>
          <p className="mt-4 text-lg text-orange-900">Stay tuned, we'll email you with updates...</p>
        </div>
      );
    }
}
