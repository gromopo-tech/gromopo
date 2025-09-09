"use client";

import { useContext, useState, useRef, useEffect } from "react";
import { BusinessIdContext } from "@/components/protected/business-id-provider";
import { storage } from "@/lib/firebase/config";
import { ref, uploadBytes } from "firebase/storage";
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { MenuFile, MenuError } from '@/types/menu';
import { Spinner } from "@/components/ui/spinner";
import Link from "next/link";

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
  const [businessMenuUploaded, setBusinessMenuUploaded] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read business doc's menuUploaded flag so we can prevent additional uploads
  useEffect(() => {
    let mounted = true;
    const fetchFlag = async () => {
      if (!businessId || !mounted) return;
      try {
        const businessRef = doc(db, 'businesses', businessId);
        const snap = await getDoc(businessRef);
        if (!mounted) return;
        const data = snap.data();
        const flag = Boolean(data?.menuUploaded);
        setBusinessMenuUploaded(flag);
        if (flag) setSubmitted(true);
      } catch (err) {
        console.error('Failed to read business menuUploaded flag', err);
        setBusinessMenuUploaded(null);
      }
    };

    fetchFlag();
    return () => { mounted = false; };
  }, [businessId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (businessMenuUploaded) return;
    if (!businessId || !e.target.files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const file = e.target.files[0];
      const menuRef = ref(storage, `businesses/${businessId}/menus/${file.name}`);
      await uploadBytes(menuRef, file);
      onMenuUploaded();
      setSubmitted(true);
    } catch (err) {
      const error = err as MenuError;
      setError("Failed to upload menu." + (error.code ? ` (${error.code})` : ''));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleContinue = async () => {
    if (!businessId) return;
    setUploading(true);
    try {
      const businessRef = doc(db, 'businesses', businessId);
      await updateDoc(businessRef, { menuUploaded: true });
      setBusinessMenuUploaded(true);
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to set menuUploaded flag:', err);
      setError('Failed to submit menus for review.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  const hasMenus = Array.isArray(menus) && menus.length > 0;

  // If the business has already marked menus uploaded, show the under-review message
  if (businessMenuUploaded) {
    return (
      <div className="p-4 rounded shadow-md max-w-2xl">
        <h3 className="font-semibold">Menu submitted</h3>
        <p className="mb-2">Your menu(s) are being reviewed. We'll notify you as soon as your order page is ready. In the meantime, you can add a Solana wallet address where you will receive customer payments in the settings.</p>
        <Link href="/dashboard/settings" className="btn border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded">
          Go to Settings
        </Link>
      </div>
    );
  }
  // Show upload panel (always visible while not submitted) and render children below when menus exist
  return (
    <div>
      <div className="p-4 rounded shadow-md max-w-2xl">
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <div className="mb-4">Upload your menu(s) in .pdf or image format to get started.
          When you're finished uploading your menu(s), click "Continue".</div>
        <label className={"btn border mb-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer" + (businessMenuUploaded ? ' opacity-50 pointer-events-none' : '')}>
          Choose file
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleUpload}
            ref={fileInputRef}
            disabled={uploading || Boolean(businessMenuUploaded)}
            className="hidden"
          />
        </label>
        {uploading && <div>Uploading...</div>}
        <div className="mt-2">
          <button
            type="button"
            onClick={handleContinue}
            // Enable Continue when there are menus uploaded OR the user performed a local upload (submitted)
            disabled={!(hasMenus || submitted) || uploading}
            className="btn bg-emerald-500 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            {uploading ? 'Submitting...' : 'Continue'}
          </button>
        </div>
      </div>

      {/* If there are uploaded menus, render the children (e.g., a list or preview) below the panel */}
      {hasMenus && (
        <div className="mt-4">{children}</div>
      )}
    </div>
  );
}
