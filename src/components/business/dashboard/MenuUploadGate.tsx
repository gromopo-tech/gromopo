"use client";

import { useContext, useEffect, useState, useRef } from "react";
import { BusinessIdContext } from "@/components/business/business-id-provider";
import { storage } from "@/lib/firebase/config";
import { ref, listAll, uploadBytes, getDownloadURL } from "firebase/storage";
import type { MenuFile, MenuError } from '@/types/menu';
import { Spinner } from "@/components/ui/spinner";

export default function MenuUploadGate({ children }: { children: React.ReactNode }) {
  const businessId = useContext(BusinessIdContext);
  const [menus, setMenus] = useState<MenuFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMenus = async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const menusRef = ref(storage, `businesses/${businessId}/menus/`);
      const res = await listAll(menusRef);
      const files: MenuFile[] = await Promise.all(
        res.items.map(async (item) => {
          return {
            name: item.name,
            fullPath: item.fullPath,
            url: await getDownloadURL(item),
          };
        })
      );
      setMenus(files);
    } catch (err) {
      const error = err as MenuError;
      setError("Failed to load menus. " + (error.code ? `(${error.code})` : ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
    // eslint-disable-next-line
  }, [businessId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!businessId || !e.target.files?.length) return;
    setUploading(true);
    setError(null);
    try {
      const file = e.target.files[0];
      const menuRef = ref(storage, `businesses/${businessId}/menus/${file.name}`);
      await uploadBytes(menuRef, file);
      await fetchMenus();
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

  if (menus.length === 0) {
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
