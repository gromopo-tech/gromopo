"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function SettingsPage() {
  const user = auth.currentUser!;
  const userRef = doc(db, "users", user.uid);
  const [settings, setSettings] = useState<{ startDay: string }>({ startDay: "sun" }); // Default settings

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(data.settings || { startDay: "sun" }); // Default to Sunday if no settings exist
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const handleStartDayChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDay = event.target.value;
    setSettings((prev) => ({ ...prev, startDay: selectedDay }));

    try {
      await updateDoc(userRef, { settings: { ...settings, startDay: selectedDay } });
      alert("Start day updated successfully!");
    } catch (error) {
      console.error("Error updating start day:", error);
      alert("Failed to update start day. Please try again.");
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 bg-white rounded shadow-md">
          <h2 className="text-lg font-semibold text-gray-600">Settings</h2>
          <p className="text-gray-600">Manage your settings here.</p>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">
              Start Day of the Week
            </label>
            <select
              value={settings.startDay}
              onChange={handleStartDayChange}
              className="w-full p-2 border rounded mt-2"
            >
              <option value="sun">Sunday</option>
              <option value="mon">Monday</option>
              <option value="tue">Tuesday</option>
              <option value="wed">Wednesday</option>
              <option value="thu">Thursday</option>
              <option value="fri">Friday</option>
              <option value="sat">Saturday</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}