"use client";

import { useState } from 'react';
import Image from 'next/image';
import { auth } from '@/lib/firebase/config';
import { multiFactor } from 'firebase/auth';
import { toast } from 'sonner';

interface TotpEnrollmentProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function TotpEnrollment({ onComplete, onCancel }: TotpEnrollmentProps) {
  const [step, setStep] = useState<'start' | 'show-qr' | 'verify'>('start');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  const startEnrollment = async () => {
    const user = auth.currentUser;
    if (!user) {
      toast.error('Please sign in again');
      return;
    }

    setLoading(true);
    try {
      const { TotpMultiFactorGenerator } = await import('firebase/auth');
      
      // Get MFA session
      const mfaSession = await multiFactor(user).getSession();
      setSession(mfaSession);
      
      // Generate TOTP secret
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(mfaSession);
      const secret = totpSecret.secretKey;
      setSecretKey(secret);
      
      // Generate QR code URL for authenticator apps
      const appName = 'Gromopo';
      const accountName = user.email || user.displayName || 'Account';
      const qrUrl = `otpauth://totp/${encodeURIComponent(appName)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(appName)}`;
      setQrCodeUrl(qrUrl);
      
      setStep('show-qr');
    } catch (error) {
      console.error('TOTP enrollment error:', error);
      toast.error('Failed to start TOTP enrollment');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnroll = async () => {
    if (!session || !verificationCode) {
      toast.error('Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const { TotpMultiFactorGenerator } = await import('firebase/auth');
      
      // Create assertion for the TOTP code
      const totpSecret = await TotpMultiFactorGenerator.generateSecret(session);
      const multiFactorAssertion = TotpMultiFactorGenerator.assertionForEnrollment(
        totpSecret,
        verificationCode
      );
      
      // Enroll the TOTP factor
      await multiFactor(auth.currentUser!).enroll(multiFactorAssertion, 'Authenticator App');
      
      toast.success('Two-factor authentication enabled successfully!');
      onComplete();
    } catch (error) {
      console.error('TOTP verification error:', error);
      toast.error('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = () => {
    if (!qrCodeUrl) return '';
    
    // Use a QR code generation service (you could also install a QR library)
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeUrl)}`;
  };

  if (step === 'start') {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Enable Two-Factor Authentication</h2>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Enhanced Security Required
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              To protect your payment settings, you must enable two-factor authentication. 
              This adds an extra layer of security to your account.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">What you'll need:</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc pl-5 space-y-1">
              <li>An authenticator app (Google Authenticator, Authy, etc.)</li>
              <li>Your phone or device with the app installed</li>
            </ul>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={startEnrollment}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Setting up...' : 'Set Up 2FA'}
            </button>
            
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'show-qr') {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Scan QR Code</h2>
        
        <div className="space-y-4">
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg inline-block">
              {qrCodeUrl && (
                <Image 
                  src={generateQRCode()} 
                  alt="TOTP QR Code" 
                  className="w-48 h-48"
                  width={192}
                  height={192}
                />
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              1. Open your authenticator app
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              2. Scan the QR code above
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              3. Enter the 6-digit code shown in your app below
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              Can't scan? Enter this key manually:
            </p>
            <code className="text-xs break-all">{secretKey}</code>
          </div>
          
          <button
            onClick={() => setStep('verify')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            I've Added the Account
          </button>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Verify Setup</h2>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter the 6-digit code from your authenticator app to complete setup:
          </p>
          
          <div>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-center text-lg font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              maxLength={6}
              onKeyDown={(e) => e.key === 'Enter' && verifyAndEnroll()}
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={verifyAndEnroll}
              disabled={loading || verificationCode.length !== 6}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Complete Setup'}
            </button>
            
            <button
              onClick={() => setStep('show-qr')}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Back to QR Code
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
