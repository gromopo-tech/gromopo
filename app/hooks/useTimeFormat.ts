"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export function useTimeFormat() {
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
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
          setTimeFormat(data.timeFormat || '12h');
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const formatTime = (time: string) => {
    if (timeFormat === '24h') return time;
    
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return { timeFormat, isLoading, formatTime };
} 