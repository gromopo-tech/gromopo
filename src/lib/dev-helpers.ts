/**
 * Development helper functions for testing account settings
 * These should only be used in development environment
 */

import { auth } from '@/lib/firebase/config';

export const devHelpers = {
  /**
   * Get current user's ID token with fresh claims
   */
  async getCurrentToken() {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user signed in');
      return null;
    }
    
    const idToken = await user.getIdToken(true);
    console.log('Current ID token:', idToken);
    return idToken;
  },

  /**
   * Check current user's custom claims
   */
  async checkClaims() {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user signed in');
      return;
    }
    
    const idTokenResult = await user.getIdTokenResult(true);
    console.log('Custom claims:', idTokenResult.claims);
    console.log('Auth time:', new Date(idTokenResult.authTime));
    console.log('Sign in second factor:', idTokenResult.claims['firebase']?.['sign_in_second_factor']);
  },

  /**
   * Check MFA enrollment status
   */
  async checkMFAStatus() {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user signed in');
      return;
    }
    
    const { multiFactor } = await import('firebase/auth');
    const mfaUser = multiFactor(user);
    const enrolledFactors = mfaUser.enrolledFactors;
    
    console.log('MFA enrolled factors:', enrolledFactors.length);
    enrolledFactors.forEach((factor, index) => {
      console.log(`Factor ${index + 1}:`, {
        uid: factor.uid,
        displayName: factor.displayName,
        factorId: factor.factorId,
        enrollmentTime: factor.enrollmentTime
      });
    });
  },

  /**
   * Test wallet API call
   */
  async testWalletAPI(businessId: string, walletAddress: string) {
    const user = auth.currentUser;
    if (!user) {
      console.log('No user signed in');
      return;
    }
    
    try {
      const idToken = await user.getIdToken(true);
      
      const response = await fetch('/api/update-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          businessId,
          walletAddress
        })
      });
      
      const result = await response.json();
      console.log('API Response:', response.status, result);
      
      if (!response.ok) {
        console.error('API Error:', result.error);
      }
      
      return result;
    } catch (error) {
      console.error('Request failed:', error);
    }
  }
};

// Make available in development console
declare global {
  interface Window {
    devHelpers?: typeof devHelpers;
  }
}

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  window.devHelpers = devHelpers;
  console.log('Dev helpers available at window.devHelpers');
}
