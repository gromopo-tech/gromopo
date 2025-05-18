"use client";

import { useEffect, useState, useRef } from "react";
import Logo from "@/components/protected/ui/logo";
import { auth } from "@/lib/firebase/config";
import { getUserData } from '@/lib/getUserData';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const router = useRouter();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { userData, loadingUserData } = getUserData();

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownVisible(false);
    }
  };

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
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 mt-2 bg-white shadow-md rounded-md z-40"
            >
              <ul className="p-4">
                {(userData?.role === 'owner' || userData?.role === 'admin') && (
                  <li>
                    <Link 
                      href="/dashboard/employees" 
                      className="block p-2 hover:bg-gray-200" 
                      onClick={handleLinkClick}>
                      Employees
                    </Link>
                  </li>
                )}
                {(userData?.role === 'owner' || userData?.role === 'admin' || userData?.role === 'taker') && (
                  <><li>
                    <Link
                      href="/dashboard/menus"
                      className="block p-2 hover:bg-gray-200"
                      onClick={handleLinkClick}>
                      Menus
                    </Link>
                  </li><li>
                      <Link
                        href="/dashboard"
                        className="block p-2 hover:bg-gray-200"
                        onClick={handleLinkClick}>
                        Orders
                      </Link>
                    </li><li>
                      <Link
                        href="/take"
                        className="block p-2 hover:bg-gray-200"
                        onClick={handleLinkClick}>
                        Take an order
                      </Link>
                    </li></>
                )}
                <li>
                  <Link 
                    href="/make"
                    className="block p-2 hover:bg-gray-200"
                    onClick={handleLinkClick}>
                    Make an order
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
            {userData ? `Hello ${userData.firstName} ${userData.lastName}` : "Hello!"}
          </ul>
          <ul className="flex flex-1 justify-end gap-3">
            <button
              onClick={async () => {
                try {
                  await signOut(auth);
                  router.push("/");
                } catch (error) {
                  console.error("Error signing out:", error);
                  alert("Failed to sign out. Please try again.");
                }
              }}
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