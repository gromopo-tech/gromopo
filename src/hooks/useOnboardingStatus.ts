"use client";

import { useState, useEffect, useContext } from 'react';
import { BusinessIdContext } from '@/components/protected/business-id-provider';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export type OnboardingStep = 'upload-menu' | 'add-wallet' | 'complete';

export interface OnboardingStatus {
  currentStep: OnboardingStep | null;
  menuUploaded: boolean | null;
  menuIntegrated: boolean | null;
  hasWallet: boolean | null;
  loading: boolean;
  isComplete: boolean;
}

export function useOnboardingStatus(): OnboardingStatus {
  const businessId = useContext(BusinessIdContext);
  const [menuUploaded, setMenuUploaded] = useState<boolean | null>(null);
  const [menuIntegrated, setMenuIntegrated] = useState<boolean | null>(null);
  const [hasWallet, setHasWallet] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const checkOnboardingStatus = async () => {
      if (!businessId) {
        if (mounted) {
          setMenuUploaded(null);
          setMenuIntegrated(null);
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
          setMenuIntegrated(typeof data.menuIntegrated === 'boolean' ? data.menuIntegrated : false);
          
          // Check wallet status
          const walletAddress = data.merchantWallet;
          const hasValidWallet = 
            walletAddress && 
            typeof walletAddress === 'string' && 
            walletAddress !== '<merchant-wallet-address>';
          setHasWallet(!!hasValidWallet);
        } else {
          setMenuUploaded(false);
          setMenuIntegrated(false);
          setHasWallet(false);
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err instanceof Error ? err.message : String(err));
        if (mounted) {
          setMenuUploaded(false);
          setMenuIntegrated(false);
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
    if (loading || menuUploaded === null || menuIntegrated === null || hasWallet === null) {
      return null;
    }

    if (!menuUploaded && !menuIntegrated) {
      return 'upload-menu';
    }
    
    if (!hasWallet) {
      return 'add-wallet';
    }
    
    return 'complete';
  };

  const currentStep = getCurrentStep();
  const isComplete = currentStep === 'complete';

  return {
    currentStep,
    menuUploaded,
    menuIntegrated,
    hasWallet,
    loading,
    isComplete
  };
}
