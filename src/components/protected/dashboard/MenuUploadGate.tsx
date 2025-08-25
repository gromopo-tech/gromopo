"use client";

import { useContext, useState, useRef, useEffect } from "react";
import { BusinessIdContext } from "@/components/protected/business-id-provider";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes } from "firebase/storage";
import { db } from '@/lib/firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import type { MenuFile, MenuError } from '@/types/menu';
import { Spinner } from "@/components/ui/spinner";

interface MenuUploadGateProps {
  children: React.ReactNode;
  menus?: MenuFile[];
  loading: boolean;
  onMenuUploaded: () => void;
}

export default function MenuUploadGate({ 
  children, 
  menus = [], 
  loading, 
  onMenuUploaded 
}: MenuUploadGateProps) {
  const businessId = useContext(BusinessIdContext);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep business doc's menuUploaded flag in sync with presence of menu files in storage
  useEffect(() => {
    let mounted = true;
    const syncFlag = async () => {
      if (!businessId || !mounted) return;
      try {
        const businessRef = doc(db, 'businesses', businessId);
        const hasMenus = Array.isArray(menus) && menus.length > 0;
        // Update only the menuUploaded field to avoid overwriting other fields
        await updateDoc(businessRef, { menuUploaded: hasMenus });
      } catch (err) {
        // Non-fatal: log for debugging but don't block UI
        console.error('Failed to sync menuUploaded flag:', err instanceof Error ? err.message : String(err));
      }
    };
    syncFlag();
    return () => { mounted = false };
  }, [businessId, menus]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!businessId || !e.target.files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const file = e.target.files[0];
      const menuRef = ref(storage, `businesses/${businessId}/menus/${file.name}`);
      await uploadBytes(menuRef, file);
      onMenuUploaded(); // Notify parent to refresh menus
    } catch (err) {
      const error = err as MenuError;
      setError("Failed to upload menu." + (error.code ? ` (${error.code})` : ''));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return <Spinner />;
  }

  if (!menus || menus.length === 0) {
    return (
      <div className="p-4 rounded shadow-md max-w-2xl">
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <div className="mb-4">Upload a menu to get started.</div>
        <label className="btn border mb-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer">
          Choose file
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleUpload}
            ref={fileInputRef}
            disabled={uploading}
            className="hidden"
          />
        </label>
        {uploading && <div>Uploading...</div>}
      </div>
    );
  }

  return <>{children}</>;
}
