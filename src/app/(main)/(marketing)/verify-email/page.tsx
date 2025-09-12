"use client";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/config";
import { sendEmailVerification, onAuthStateChanged, type User } from "firebase/auth";
import { toast } from 'sonner';
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      // If no user or user is already verified, redirect
      if (!currentUser || currentUser.emailVerified) {
        router.replace("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Resend verification email
  const resendVerification = async () => {
    if (!user) {
      toast.error('No user available to resend verification.');
      return;
    }
    setIsResending(true);
    try {
      await sendEmailVerification(user);
      toast.success('Verification email sent.');
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const continueAfterVerification = async () => {
    if (!user) {
      toast.error('No user found. Please sign in again.');
      return;
    }

    try {
      // Reload user to get fresh email verification status
      await user.reload();
      
      if (user.emailVerified) {
        // Set session cookie
        const idToken = await user.getIdToken(true);
        await fetch("/api/set-session-cookie", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: idToken }),
        });
        
        // Use window.location.replace to force a full page reload
        // This ensures all components get fresh auth state including email verification
        window.location.replace("/dashboard");
      } else {
        toast.error('Email not yet verified. Please check your email and try again.');
      }
    } catch (error) {
      console.error('Continue verification error:', error);
      toast.error('Failed to verify email status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h1 className="pb-12 text-center text-3xl font-semibold">
            No User Found
          </h1>
          <p>Please sign in to verify your email.</p>
          <button
            onClick={() => router.push('/signin')}
            className="btn mt-4 border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="MsoNormal" style={{ lineHeight: "1.1" }}>
        <br />
      </div>
      <div style={{ lineHeight: "1.5" }}>
        <br />
      </div>
      <h1 className="pb-12 text-center text-3xl font-semibold">
        Verify Your Email
      </h1>
      
      <div className="max-w-md mx-auto text-center space-y-4">
        <p>Check your email to verify your address.</p>
        
        <div className="space-y-2">
          <button
            type="button"
            onClick={resendVerification}
            disabled={isResending}
            className="btn w-full border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </button>
          
          <button
            type="button"
            onClick={continueAfterVerification}
            className="btn w-full border hover:bg-neutral-100 dark:hover:bg-neutral-800 bg-neutral-200 dark:bg-neutral-700 text-gray-900 dark:text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500 cursor-pointer"
          >
            I'm verified — Continue
          </button>
        </div>

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Wrong email address? 
            <button
              onClick={() => {
                auth.signOut();
                router.push('/signin');
              }}
              className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign in with a different account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
