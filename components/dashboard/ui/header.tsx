"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/marketing/ui/logo";
import { auth } from "@/lib/firebase/config";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Set the user's display name or email
        setUserName(user.displayName || user.email || "User");
      } else {
        setUserName(null); // Clear the name if the user is not logged in
      }
    });

    return () => unsubscribe(); // Cleanup the listener on unmount
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth); // Sign out the user
      router.push("/"); // Redirect to the home page after signing out
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };


  return (
    <header className="z-30 mt-2 w-full md:mt-5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-green-900/90 px-3 before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-transparent before:[background:linear-gradient(to_right,var(--color-green-800),var(--color-green-700),var(--color-green-800))_border-box] before:[mask-composite:exclude_!important] before:[mask:linear-gradient(white_0_0)_padding-box,_linear-gradient(white_0_0)] after:absolute after:inset-0 after:-z-10 after:backdrop-blur-xs">
          {/* Company logo and name */}
          <div className="gap-3 flex flex-1 items-center">
            <Logo />
            <ul className="md:flex nline-flex bg-linear-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent md:text-2xl justify-center font-semibold">
              GroMoPo
            </ul>
          </div>
          <ul className="hidden md:flex flex-1 items-center justify-center gap-3">
              {userName ? `Hello ${userName}` : "Hello!"}
        </ul>
          <ul className="flex flex-1 items-center justify-end gap-3">
            <li>
              <button
                onClick={handleSignOut}
                className="btn-sm bg-linear-to-t from-orange-400 to-orange-500 bg-[length:100%_100%] bg-[bottom] py-[5px] text-orange-200 shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
              >
                Sign Out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}