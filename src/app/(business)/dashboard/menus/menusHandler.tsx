"use client";

import { useContext, useEffect, useState, useRef } from "react";
import { BusinessIdContext } from "@/components/business/business-id-provider";
import { storage } from "@/lib/firebase/config";
import { Spinner } from "@/components/ui/spinner";
import {
  ref,
  listAll,
  getDownloadURL,
  uploadBytes,
  deleteObject,
} from "firebase/storage";

import MenuUploadGate from '@/components/business/dashboard/MenuUploadGate';
import type { MenuFile, MenuError } from '@/types/menu';

export default function MenusHandler() {
  const businessId = useContext(BusinessIdContext);
  const [menus, setMenus] = useState<MenuFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const fetchMenus = async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const menusRef = ref(storage, `businesses/${businessId}/menus/`);
      const res = await listAll(menusRef);
      const files: MenuFile[] = await Promise.all(
        res.items.map(async (item) => {
          const url = await getDownloadURL(item);
          return {
            name: item.name,
            fullPath: item.fullPath,
            url,
          };
        })
      );
      setMenus(files);
    } catch (err) {
      const error = err as MenuError;
      // Log error for debugging
      console.error('Error loading menus:', error);
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

  const handleReplace = async (menu: MenuFile, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!businessId || !e.target.files?.length) return;
    setReplacingId(menu.fullPath);
    setError(null);
    try {
      const file = e.target.files[0];
      const menuRef = ref(storage, menu.fullPath);
      await uploadBytes(menuRef, file);
      await fetchMenus();
    } catch (err) {
      const error = err as MenuError;
      setError("Failed to replace menu." + (error.code ? ` (${error.code})` : ''));
    } finally {
      setReplacingId(null);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  };

  const handleDelete = async (menu: MenuFile) => {
    if (!window.confirm(`Delete menu '${menu.name}'?`)) return;
    setError(null);
    try {
      const menuRef = ref(storage, menu.fullPath);
      await deleteObject(menuRef);
      await fetchMenus();
    } catch (err) {
      const error = err as MenuError;
      setError("Failed to delete menu." + (error.code ? ` (${error.code})` : ''));
    }
  };

  return (
    <MenuUploadGate>
      <div className="flex flex-col w-full h-full p-6 space-y-6">
        <div className="p-4 rounded shadow-md max-w-2xl">
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {loading ? (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          ) : menus.length === 0 ? null : (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <label className="btn border mb-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer">
                  Upload menu
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleUpload}
                    ref={fileInputRef}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {uploading && <Spinner size="xs" className="ml-2" />}
              </div>
              <table className="w-full border text-left border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="p-2">Menu File</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menus.map((menu) => (
                    <tr key={menu.fullPath} className="border-t">
                      <td className="p-2">
                        <a href={menu.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{menu.name}</a>
                      </td>
                      <td className="p-2 flex gap-2 items-center">
                        <label className="btn border mb-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer">
                          Replace
                          <input
                            type="file"
                            accept="application/pdf,image/*"
                            style={{ display: "none" }}
                            onChange={(e) => handleReplace(menu, e)}
                            ref={replaceInputRef}
                            disabled={replacingId === menu.fullPath}
                          />
                        </label>
                        <button
                          className="text-red-600 hover:underline cursor-pointer"
                          onClick={() => handleDelete(menu)}
                          disabled={replacingId === menu.fullPath}
                        >
                          Delete
                        </button>
                        {replacingId === menu.fullPath && <span className="ml-2">Replacing...</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MenuUploadGate>
  );
// ...existing code ends here, no stray bracket...
}
