"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/dashboard/ui/label";

export default function SettingsPage() {
  const [is24HourFormat, setIs24HourFormat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const settingsDocRef = doc(db, 'settings', user.uid);
        const settingsDoc = await getDoc(settingsDocRef);
        
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setIs24HourFormat(data.timeFormat === '24h');
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleTimeFormatChange = async (checked: boolean) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const settingsDocRef = doc(db, 'settings', user.uid);
      await updateDoc(settingsDocRef, {
        timeFormat: checked ? '24h' : '12h'
      });

      setIs24HourFormat(checked);
    } catch (error) {
      console.error("Error updating time format:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Time Format Settings */}
        <div className="p-4 bg-white rounded shadow-md">
          <h2 className="text-lg font-semibold text-gray-600 mb-4">Time Format</h2>
          <div className="flex items-center space-x-2">
            <Switch
              id="time-format"
              checked={is24HourFormat}
              onCheckedChange={handleTimeFormatChange}
            />
            <Label htmlFor="time-format">
              {is24HourFormat ? '24-hour format' : '12-hour format'}
            </Label>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {is24HourFormat ? 'Times will be displayed in 24-hour format (e.g., 14:30)' : 'Times will be displayed in 12-hour format (e.g., 2:30 PM)'}
          </p>
        </div>
      </div>
    </div>
  );
}