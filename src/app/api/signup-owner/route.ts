import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/adminConfig';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const { uid, businessId, idToken, businessName, subdomain, normalizedName } = await req.json();

    // Handle legacy calls (backwards compatibility)
    if (uid && businessId && !idToken) {
      try {
        await adminAuth.setCustomUserClaims(uid, { role: 'owner', businessId });
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to set custom claims' }, { status: 500 });
      }
    }

    // New flow: create business with subdomain uniqueness enforcement
    if (!idToken || !businessName || !subdomain || !normalizedName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the ID token and get user UID
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const userUid = decodedToken.uid;

    const db = getFirestore();

    // Check if normalized name already exists (prevents punctuation variations)
    const normalizedQuery = db.collection('businesses').where('normalizedName', '==', normalizedName);
    const normalizedSnapshot = await normalizedQuery.get();
    
    if (!normalizedSnapshot.empty) {
      return NextResponse.json({ 
        error: 'Business name already taken (ignoring punctuation and spacing)' 
      }, { status: 409 });
    }

    // Use subdomain as document ID for guaranteed uniqueness
    const businessDocRef = db.doc(`businesses/${subdomain}`);

    try {
      // Atomic create - fails if document already exists
      await businessDocRef.create({
        name: businessName,
        normalizedName, // Store normalized name for uniqueness checking
        businessType: 'other',
        description: 'Fresh food made to order',
        ownerId: userUid,
        menuUploaded: false,
        menuIntegrated: false,
        hasWallet: false,
        createdAt: new Date(),
      });

      // Set custom claims for the user
      await adminAuth.setCustomUserClaims(userUid, {
        role: 'owner', 
        businessId: subdomain 
      });

      return NextResponse.json({ 
        success: true, 
        businessId: subdomain 
      });

    } catch (error: unknown) {
      console.error('Business creation error:', error);
      
      // Check if it's a "document already exists" error
      if (error && typeof error === 'object' && 'code' in error && error.code === 6) {
        return NextResponse.json({ 
          error: 'Subdomain already taken' 
        }, { status: 409 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to create business' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ 
      error: 'Invalid request' 
    }, { status: 400 });
  }
}
