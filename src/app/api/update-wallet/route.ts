import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/adminConfig';
import { PublicKey } from '@solana/web3.js';

export async function POST(req: Request) {
  try {
    const { businessId, walletAddress } = await req.json();

    if (!businessId || !walletAddress) {
      return NextResponse.json({ error: 'Missing businessId or walletAddress' }, { status: 400 });
    }

    // Get the ID token from the Authorization header
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace('Bearer ', '');
    
    if (!idToken) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 });
    }

    let decodedToken;
    try {
      // Verify the ID token and force refresh to get latest claims
      decodedToken = await adminAuth.verifyIdToken(idToken, true);
    } catch (error) {
      console.error('Token verification error:', error);
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Check if user is owner
    const userRole = decodedToken.role;
    const userBusinessId = decodedToken.businessId;

    if (userRole !== 'owner') {
      return NextResponse.json({ error: 'Only business owners can update wallet addresses' }, { status: 403 });
    }

    if (userBusinessId !== businessId) {
      return NextResponse.json({ error: 'Unauthorized access to business' }, { status: 403 });
    }

    // Check MFA and recent authentication
    const authTime = new Date(decodedToken.auth_time * 1000);
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Require recent authentication (within 5 minutes)
    if (authTime < fiveMinutesAgo) {
      return NextResponse.json({ 
        error: 'Recent authentication required. Please sign in again.' 
      }, { status: 401 });
    }

    // Check for MFA (Firebase sets firebase.sign_in_second_factor when MFA is used)
    const signInSecondFactor = decodedToken['firebase']?.['sign_in_second_factor'];
    if (!signInSecondFactor) {
      return NextResponse.json({ 
        error: 'Multi-factor authentication required for wallet updates' 
      }, { status: 401 });
    }

    // Validate Solana wallet address format
    try {
      new PublicKey(walletAddress);
    } catch {
      return NextResponse.json({ error: 'Invalid Solana wallet address format' }, { status: 400 });
    }

    // Update the wallet address in Firestore
    const businessRef = adminDb.collection('businesses').doc(businessId);
    
    try {
      await businessRef.update({
        merchantWallet: walletAddress,
        walletUpdatedAt: new Date(),
        walletUpdatedBy: decodedToken.uid
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Wallet address updated successfully' 
      });

    } catch (firestoreError) {
      console.error('Firestore update error:', firestoreError);
      return NextResponse.json({ 
        error: 'Failed to update wallet address in database' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Wallet update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
