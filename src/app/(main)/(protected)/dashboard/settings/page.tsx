"use client";

import { RoleContext } from '@/components/protected/role-provider';
import { BusinessIdContext } from '@/components/protected/business-id-provider';
import { useContext } from 'react';
import { redirect } from 'next/navigation';
import { WalletSettings } from '@/components/protected/dashboard/wallet-settings';

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
        </div>
      </div>
    </div>
  );
}
