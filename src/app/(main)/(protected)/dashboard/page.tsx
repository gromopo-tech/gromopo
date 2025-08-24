'use client';

import { RoleContext } from '@/components/protected/role-provider'
import { useContext } from 'react'


export default function DashboardPage() {
  const role = useContext(RoleContext);
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <a href="/dashboard/orders" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              View Orders
            </a>
            <a href="/dashboard/menus" className="block text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              Manage Menus
            </a>
          </div>
        </div>
        
        {role === 'owner' ? (<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">ChatGMP Assistant</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Get instant help with your business operations using our AI assistant.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click the chat icon in the bottom right corner to get started!
          </p>
        </div>) : null}

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <p className="text-gray-600 dark:text-gray-300">
            No recent activity to display.
          </p>
        </div>
      </div>
    </div>
  );
}