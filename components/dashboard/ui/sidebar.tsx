"use client";
import { useState } from "react";
import Link from "next/link";

export default function Sidebar() {

  return (
    <aside className="w-64 bg-green-900 text-white h-screen p-4">
      <nav className="space-y-4">
        {/* Link Header text of dashobard to /dashboard/ home page */}
        <Link
          href="/dashboard"
          className="flex items-center text-lg font-semibold text-white hover:text-orange-400"
        >
          <span className="text-lg font-semibold">🏠</span> Dashboard
        </Link>
        <ul className="space-y-2 items-center text-left">
          <li className="items-center text-left">
            <Link
              href="/dashboard/employees"
              className="block hover:text-orange-400"
            >
              Employees
            </Link>
            <Link
                href="/dashboard/schedules"
                className="hover:text-orange-400"
            >
              Schedules
            </Link>
          </li>

          {/* Other Sections */}
          <li>
            <Link
              href="/dashboard/settings"
              className="block hover:text-orange-400"
            >
              Settings
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}