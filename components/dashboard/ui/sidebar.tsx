"use client";
import { useState } from "react";
import Link from "next/link";

export default function Sidebar() {
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false); // State to toggle dropdown

  const toggleSchedulingDropdown = () => {
    setIsSchedulingOpen((prev) => !prev);
  };

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
          {/* Scheduling Section */}
          <li className="items-center text-left">
            <button
              onClick={toggleSchedulingDropdown}
              className={`mr-2 transform transition-transform hover:text-orange-400 ${
                isSchedulingOpen ? "rotate-90" : ""
              }`}
            >
              {/* Arrow Icon */}
              <span
              >
                ▶
              </span>
            </button>
            <Link
                href="/dashboard/scheduling"
                className="hover:text-orange-400"
            >
              Scheduling
            </Link>
            {/* Scheduling Dropdown */}
            {isSchedulingOpen && (
              <ul className="ml-6 mt-2 space-y-2">
                <li>
                  <Link
                    href="/dashboard/scheduling/employees"
                    className="block hover:text-orange-400"
                  >
                    Employees
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/scheduling/tasks"
                    className="block hover:text-orange-400"
                  >
                    Tasks
                  </Link>
                </li>
              </ul>
            )}
          </li>

          {/* Other Sections */}
          <li>
            <Link
              href="/dashboard/ordering"
              className="block hover:text-orange-400"
            >
              Ordering
            </Link>
          </li>
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