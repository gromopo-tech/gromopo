"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser({
        name: currentUser.displayName,
        email: currentUser.email,
        photoURL: currentUser.photoURL,
      });
    }
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className="flex-grow p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {/* User Profile */}
          {user ? (
            <div className="p-4 bg-white rounded shadow-md">
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-16 h-16 rounded-full mb-4"
              />
              <h2 className="text-lg font-semibold text-gray-600">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          ) : (
            <p>Loading user details...</p>
          )}
        </div>
      </div>
    </div>
  );
}