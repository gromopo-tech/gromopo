"use client";

import { useState, useEffect, useContext } from 'react';
import { BusinessIdContext } from '@/components/protected/business-id-provider';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';

export type OnboardingStep = 'upload-menu' | 'add-wallet' | 'print-qr' | 'complete';

export interface OnboardingStatus {
  currentStep: OnboardingStep | null;
  menuUploaded: boolean | null;
  hasWallet: boolean | null;
  loading: boolean;
  isComplete: boolean;
  markComplete: () => void;
}

export function useOnboardingStatus(): OnboardingStatus {
  const businessId = useContext(BusinessIdContext);
  const [menuUploaded, setMenuUploaded] = useState<boolean | null>(null);
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkOnboardingStatus = async () => {
      if (!businessId) {
        if (mounted) {
          setMenuUploaded(null);
          setHasWallet(null);
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        const ref = doc(db, 'businesses', businessId);
        const snap = await getDoc(ref);
        
        if (!mounted) return;
        
        if (snap.exists()) {
          const data = snap.data() as Record<string, unknown>;
          
          // Check menu status
          setMenuUploaded(typeof data.menuUploaded === 'boolean' ? data.menuUploaded : false);

          // Check wallet status
          const walletAddress = data.merchantWallet;
          const hasValidWallet = 
            walletAddress && 
            typeof walletAddress === 'string' && 
            walletAddress !== '<merchant-wallet-address>';
          setHasWallet(!!hasValidWallet);

          // Check if onboarding is complete
          setIsComplete(data.onboardingComplete === true);
        } else {
          setMenuUploaded(false);
          setHasWallet(false);
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err instanceof Error ? err.message : String(err));
        if (mounted) {
          setMenuUploaded(false);
          setHasWallet(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkOnboardingStatus();
    return () => { mounted = false };
  }, [businessId]);

  // Determine current onboarding step
  const getCurrentStep = (): OnboardingStep | null => {
    if (loading || menuUploaded === null || hasWallet === null) {
      return null;
    }

    if (isComplete) {
      return 'complete';
    }

    if (!menuUploaded) {
      return 'upload-menu';
    }
    if (menuUploaded && !hasWallet) {
      return 'add-wallet';
    }

    if (menuUploaded && hasWallet) {
      return 'print-qr';
    }

    return 'complete';
  };

  const currentStep = getCurrentStep();
  
  const markComplete = async (): Promise<void> => {
    if (!businessId) return;
    
    try {
      const ref = doc(db, 'businesses', businessId);
      await updateDoc(ref, {
        onboardingComplete: true
      });
      setIsComplete(true);
    } catch (error) {
      console.error('Error marking onboarding as complete:', error);
      toast.error('Failed to update onboarding status');
    }
  };

  return {
    currentStep,
    menuUploaded,
    hasWallet,
    loading,
    isComplete,
    markComplete
  };
}
