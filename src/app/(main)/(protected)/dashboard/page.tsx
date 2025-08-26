"use client";

import { RoleContext } from '@/components/protected/role-provider'
import { useContext, useEffect, useState } from 'react'
import { BusinessIdContext } from '@/components/protected/business-id-provider'
import { db, auth } from '@/lib/firebase/config'
import { doc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default function DashboardPage() {
  const role = useContext(RoleContext);
  const businessId = useContext(BusinessIdContext);
  const [verified, setVerified] = useState<boolean | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [menuUploaded, setMenuUploaded] = useState<boolean | null>(null);

  // Fetch subdomain and menuUploaded from business doc
  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      if (!businessId) {
        if (mounted) setSubdomain(null);
        return;
      }
      try {
        const ref = doc(db, 'businesses', businessId);
        const snap = await getDoc(ref);
        if (!mounted) return;
        if (snap.exists()) {
          const data = snap.data() as Record<string, unknown>;
          setSubdomain(typeof data.subdomain === 'string' ? data.subdomain : null);
          setMenuUploaded(typeof data.menuUploaded === 'boolean' ? data.menuUploaded : null);
        } else {
          setSubdomain(null);
          setMenuUploaded(null);
        }
      } catch (err) {
        console.error('Error loading business flags:', err instanceof Error ? err.message : String(err));
        if (!mounted) return;
        setSubdomain(null);
        setMenuUploaded(null);
      }
    };
    fetch();
    return () => { mounted = false };
  }, [businessId]);

  // Subscribe to auth state to get emailVerified
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setVerified(null);
      } else {
        setVerified(Boolean(user.emailVerified));
      }
    });
    return () => unsub();
  }, []);
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          {menuUploaded === false ? (
            <div>
              <p className="mb-4">Upload a menu to get started.</p>
              <a href="/dashboard/menus" className="btn border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded">
                Go to Menus
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              <a href="/dashboard/orders" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                View Orders
              </a>
              <a href="/dashboard/menus" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Manage Menus
              </a>
            </div>
          )}
        </div>
        
        {role === 'owner' ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">GMPchat Assistant</h2>
            {subdomain === '' ? (
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Launch your ordering page to unlock the AI assistant and get instant help with your business operations.
              </p>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Check out GMPchat in the menu above to get instant help with your business operations using our AI assistant.
                </p>
              </>
            )}
          </div>
        ) : null}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          {verified === false ? (
            <div>
              <p className="text-gray-600 dark:text-gray-300 mb-2">A verification email has been sent. Verify your email to launch your ordering page.</p>
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">No recent activity to display.</p>
          )}
        </div>
      </div>
    </div>
  );
}