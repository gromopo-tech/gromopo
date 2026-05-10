"use client";

import { RoleContext } from '@/components/protected/role-provider';
import { BusinessIdContext } from '@/components/protected/business-id-provider';
import { useContext } from 'react';
import { redirect } from 'next/navigation';
import { WalletSettings } from '@/components/protected/dashboard/settings/wallet-settings';
import { QRCodeSection } from '@/components/protected/dashboard/settings/qr-code-section';
import Link from 'next/link';

export default function SettingsPage() {
  const role = useContext(RoleContext);
  const businessId = useContext(BusinessIdContext);

  // Only owners can access settings
  if (role !== 'owner') {
    redirect('/dashboard');
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Account Settings
        </h1>
        
        <div className="grid gap-6">
          <WalletSettings businessId={businessId} />
          {businessId && <QRCodeSection businessId={businessId} />}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">Google Reviews</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              Upload a Google Business Profile export to power your AI review assistant. Re-uploading
              is safe — duplicates are detected and overwritten.
            </p>
            <Link
              href="/dashboard/reviews/upload"
              className="inline-block btn border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded text-sm"
            >
              Upload reviews
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
