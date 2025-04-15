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
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <ul className="space-y-2">
          {/* Scheduling Section */}
          <li>
            <button
              onClick={toggleSchedulingDropdown}
              className="w-full flex items-center text-left hover:text-orange-400"
            >
              {/* Arrow Icon */}
              <span
                className={`mr-2 transform transition-transform ${
                  isSchedulingOpen ? "rotate-90" : ""
                }`}
              >
                ▶
              </span>
              Scheduling
            </button>
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