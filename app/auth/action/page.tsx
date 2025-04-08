// app/auth/action/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { 
  getAuth, 
  applyActionCode, 
  checkActionCode, 
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';

function EmailActionHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Get URL parameters
  let mode = searchParams.get('mode');
  let actionCode = searchParams.get('oobCode');
  const continueUrl = searchParams.get('continueUrl');
  const lang = searchParams.get('lang') || 'en';

  useEffect(() => {
    if (!mode || !actionCode) {
      setError('Invalid action link: missing parameters');
      setStatus('error');
      return;
    }

    const handleAction = async () => {
      try {

        const emulatorMatch = window.location.href.match(/emulator\/action\?(.*)/);
        if (emulatorMatch) {
          const emulatorParams = new URLSearchParams(emulatorMatch[1]);
          mode = emulatorParams.get('mode');
          actionCode = emulatorParams.get('oobCode');
          
          if (!mode || !actionCode) {
            throw new Error('Emulator link missing parameters');
          }
        } else {
          throw new Error('Invalid action link: missing parameters');
        }
        
        
        switch (mode) {
          case 'verifyEmail':
            await handleVerifyEmail();
            break;
          case 'resetPassword':
            await handleResetPassword();
            break;
          case 'recoverEmail':
            await handleRecoverEmail();
            break;
          default:
            throw new Error('Invalid action type');
        }
      } catch (err) {
        console.error('Action failed:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setStatus('error');
      }
    };

    handleAction();
  }, [mode, actionCode]);

  const handleVerifyEmail = async () => {
    await applyActionCode(auth, actionCode!);
    setStatus('success');
    // Optional: Redirect after delay
    setTimeout(() => router.push(continueUrl || '/'), 3000);
  };

  const handleResetPassword = async () => {
    // First verify the code is valid and get the email
    const email = await verifyPasswordResetCode(auth, actionCode!);
    setEmail(email);
    setStatus('success'); // Show password reset form
  };

  const handleRecoverEmail = async () => {
    const info = await checkActionCode(auth, actionCode!);
    await applyActionCode(auth, actionCode!);
    setEmail(info.data.email || null);
    setStatus('success');
  };

  const submitNewPassword = async () => {
    try {
      await confirmPasswordReset(auth, actionCode!, newPassword);
      setStatus('success');
      router.push('/login?reset=success');
    } catch (err) {
      setError('Failed to reset password. The link may have expired.');
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg">Processing your request...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  // Success states
  if (mode === 'verifyEmail') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Email Verified</h2>
          <p className="mb-4">Your email has been successfully verified.</p>
          <Button onClick={() => router.push(continueUrl || '/')}>
            Continue to {continueUrl ? 'your destination' : 'home'}
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'resetPassword' && email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
          <p className="mb-2">Reset password for: {email}</p>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block mb-1">New Password</label>
              <input
                type="password"
                id="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
                minLength={6}
              />
            </div>
            
            <Button 
              onClick={submitNewPassword}
              disabled={newPassword.length < 6}
            >
              Reset Password
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'recoverEmail' && email) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Email Recovered</h2>
          <p className="mb-4">Your email {email} has been successfully recovered.</p>
          <Button onClick={() => router.push('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return null;
}

export default function EmailActionHandlerPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailActionHandler />
    </Suspense>
  );
}