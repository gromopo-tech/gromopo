"use client";

import { useState, useEffect, useContext } from 'react';
import { BusinessIdContext } from '@/components/protected/business-id-provider';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

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

    if (!menuUploaded) {
      return 'upload-menu';
    }
    if (menuUploaded && !hasWallet) {
      return 'add-wallet';
    }

    if (menuUploaded && hasWallet) {
      return 'print-qr';
    }
    //TODO: Define criteria for "complete" step to display default quick actions
    return 'complete';
  };

  const currentStep = getCurrentStep();
  
  const markComplete = () => {
    setIsComplete(true);
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
