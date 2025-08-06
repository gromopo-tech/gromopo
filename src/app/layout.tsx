import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/app-providers'
import { AppLayout } from '@/components/app-layout'
import React from 'react'
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { RoleProvider } from '@/components/business/role-provider';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'GroMoPo',
  description: '',
  manifest: '/manifest.json',
  icons: [
    { rel: 'icon', url: '/images/logo.png' },
    { rel: 'apple-touch-icon', url: '/images/logo.png' }
  ],
};

export const viewport = {
  themeColor: '#ff6600',
}

export default async function RootLayout({ 
  children 
}: Readonly<{ 
  children: React.ReactNode 
}>) {
  // Get JWT from cookies and decode role (server-side only)
  let role: string | null = null;
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session');
    const token = sessionCookie?.value;
    if (token) {
      const decoded = jwt.decode(token) as { role?: string } | null;
      role = decoded?.role || null;
    }
  } catch (error) {
    // Handle cookie parsing errors gracefully
    console.warn('Cookie parsing error:', error);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <RoleProvider role={role}>
          <AppProviders>
            <AppLayout>{children}</AppLayout>
          </AppProviders>
        </RoleProvider>
      </body>
    </html>
  )
}

// Patch BigInt so we can log it using JSON.stringify without any errors
declare global {
  interface BigInt {
    toJSON(): string
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString()
}
