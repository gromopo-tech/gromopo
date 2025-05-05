"use client";

import { useEffect, useState, useRef } from "react";
import Logo from "@/components/dashboard/ui/logo";
import { auth } from "@/lib/firebase/config";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserName(user.displayName || user.email || "User");
      } else {
        setUserName(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Failed to sign out. Please try again.");
    }
  };

  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLinkClick = () => {
    setIsDropdownVisible(false);
  };

  return (
    <header className="z-30 mt-2 w-full md:mt-5">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center justify-between gap-3 rounded-2xl bg-green-900/90 px-3">
          {/* Hamburger Icon */}
          <button 
            onClick={toggleDropdown} 
            className="text-white hover:text-yellow-600 text-2xl">
            ☰
          </button>

          {/* Dropdown Menu */}
          {isDropdownVisible && (
            <div ref={dropdownRef} className="absolute left-0 mt-14 bg-white shadow-md rounded-md">
              <ul className="p-4">
                <li>
                  <Link 
                    href="/dashboard/employees" 
                    className="block p-2 hover:bg-gray-200" 
                    onClick={handleLinkClick}>
                    Employees
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard/schedules" 
                    className="block p-2 hover:bg-gray-200"
                    onClick={handleLinkClick}>
                    Schedules
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/dashboard/settings" 
                    className="block p-2 hover:bg-gray-200"
                    onClick={handleLinkClick}>
                    Settings
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Company logo and name */}
          <div className="gap-3 flex flex-1 items-center">
            <Logo />
            <ul className="md:flex nline-flex bg-linear-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent md:text-2xl justify-center font-semibold">
              GroMoPo
            </ul>
          </div>
          <ul className="md:flex flex-1 justify-center text-amber-300">
            {userName ? `Hello ${userName}` : "Hello!"}
          </ul>
          <ul className="flex flex-1 justify-end gap-3">
            <button
              onClick={handleSignOut}
              className="btn-sm bg-linear-to-t from-orange-400 to-orange-500 bg-[length:100%_100%] bg-[bottom] py-[5px] text-orange-200 shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:10%_190%]"
            >
              Sign Out
            </button>
          </ul>
        </div>
      </div>
    </header>
  );
}