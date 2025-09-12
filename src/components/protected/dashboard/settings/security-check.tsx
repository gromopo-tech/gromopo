"use client";

import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase/config';
import { 
  reauthenticateWithCredential, 
  EmailAuthProvider,
  multiFactor
} from 'firebase/auth';
import { toast } from 'sonner';

interface SecurityCheckProps {
  onSecurityPassed: () => void;
  onTotpRequired: () => void;
}

export function SecurityCheck({ onSecurityPassed, onTotpRequired }: SecurityCheckProps) {
  const [step, setStep] = useState<'check' | 'reauth' | 'mfa' | 'complete'>('check');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authTime, setAuthTime] = useState<number | null>(null);
  const [hasMFA, setHasMFA] = useState(false);
  const [mfaResolver, setMfaResolver] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [totpCode, setTotpCode] = useState('');

  const checkSecurityStatus = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Get the ID token to check auth time
      const idTokenResult = await user.getIdTokenResult();
      const authTimestamp = new Date(idTokenResult.authTime).getTime();
      setAuthTime(authTimestamp);

      // Check if user has MFA enrolled
      const mfaUser = multiFactor(user);
      const enrolledFactors = mfaUser.enrolledFactors;
      setHasMFA(enrolledFactors.length > 0);

      // Check if recent authentication (within last 5 minutes)
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      const isRecentAuth = authTimestamp > fiveMinutesAgo;

      if (isRecentAuth && enrolledFactors.length > 0) {
        // User has recent auth and MFA, they're good to go
        setStep('complete');
        onSecurityPassed();
      } else if (!isRecentAuth) {
        // Need to re-authenticate
        setStep('reauth');
      } else if (enrolledFactors.length === 0) {
        // Need to enroll in MFA
        onTotpRequired();
      }
    } catch (error) {
      console.error('Error checking security status:', error);
      toast.error('Failed to verify security status');
    }
  }, [onSecurityPassed, onTotpRequired]);

  useEffect(() => {
    checkSecurityStatus();
  }, [checkSecurityStatus]);

  const handleReauthenticate = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error('User not found');
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Update auth time
      const idTokenResult = await user.getIdTokenResult(true);
      const authTimestamp = new Date(idTokenResult.authTime).getTime();
      setAuthTime(authTimestamp);
      
      // Check MFA status after reauth
      if (hasMFA) {
        setStep('complete');
        onSecurityPassed();
        toast.success('Security verification complete');
      } else {
        onTotpRequired();
      }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      console.error('Reauthentication error:', error);
      
      if (error.code === 'auth/multi-factor-auth-required') {
        // Handle MFA challenge
        setMfaResolver(error.resolver);
        setStep('mfa');
      } else {
        toast.error('Failed to verify password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerification = async () => {
    if (!mfaResolver || !totpCode) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const { TotpMultiFactorGenerator } = await import('firebase/auth');
      const cred = TotpMultiFactorGenerator.assertionForSignIn(
        mfaResolver.hints[0].uid,
        totpCode
      );
      
      await mfaResolver.resolveSignIn(cred);
      setStep('complete');
      onSecurityPassed();
      toast.success('Security verification complete');
    } catch (error) {
      console.error('MFA verification error:', error);
      toast.error('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAuthTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (step === 'complete') {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
              Security Verification Complete
            </h3>
            <p className="text-sm text-green-600 dark:text-green-300">
              You can now update your wallet address.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'mfa') {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Multi-Factor Authentication</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Enter the 6-digit code from your authenticator app:
        </p>
        
        <div className="space-y-4">
          <input
            type="text"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-center text-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            maxLength={6}
          />
          
          <button
            onClick={handleMfaVerification}
            disabled={loading || totpCode.length !== 6}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Security Verification Required</h2>
      
      <div className="space-y-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Additional Security Required
              </h3>
              <div className="mt-2 text-sm text-amber-600 dark:text-amber-300">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Recent password verification required</li>
                  <li>Multi-factor authentication must be enabled</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {authTime && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last authenticated: {formatAuthTime(authTime)}
          </p>
        )}

        {step === 'reauth' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Confirm your password:
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleReauthenticate()}
              />
            </div>
            
            <button
              onClick={handleReauthenticate}
              disabled={loading || !password}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
