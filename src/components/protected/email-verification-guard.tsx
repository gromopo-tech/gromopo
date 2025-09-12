"use client";
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface EmailVerificationGuardProps {
  children: React.ReactNode;
}

export default function EmailVerificationGuard({ children }: EmailVerificationGuardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // If no user or email is not verified, redirect
      if (!currentUser) {
        router.replace('/signin');
      } else if (!currentUser.emailVerified) {
        router.replace('/verify-email');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || !user.emailVerified) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
