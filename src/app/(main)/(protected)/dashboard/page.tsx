"use client";

import { RoleContext } from '@/components/protected/role-provider'
import { useContext, useEffect, useState } from 'react'
import { auth } from '@/lib/firebase/config'
import { onAuthStateChanged } from 'firebase/auth'
import Link from 'next/link'
import { useOnboardingStatus } from '@/hooks/useOnboardingStatus'
import { OnboardingPrompt } from '@/components/protected/dashboard/onboarding-prompt'

export default function DashboardPage() {
  const role = useContext(RoleContext);
  const [verified, setVerified] = useState<boolean | null>(null);
  const { currentStep, hasWallet, loading, isComplete } = useOnboardingStatus();

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
          {loading ? (
            <div>Loading...</div>
          ) : currentStep && currentStep !== 'complete' && !isComplete ? (
            <OnboardingPrompt 
              step={currentStep}
              className="p-0"
            />
          ) : (
            <div className="space-y-2">
              <Link href="/dashboard/orders" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                View Orders
              </Link>
              <Link href="/dashboard/menus" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                Manage Menus
              </Link>
            </div>
          )}
        </div>
        
        {role === 'owner' ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">GMPchat Assistant</h2>
            {!hasWallet ? (
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

        {role === 'owner' ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Manage your business settings and payment configurations.
            </p>
            <Link href="/dashboard/settings" className="btn border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded">
              Manage Settings
            </Link>
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