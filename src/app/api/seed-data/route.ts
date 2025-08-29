import { NextResponse } from 'next/server';
import { seedFirestoreData } from '@/lib/firebase/seed-data';

export async function POST() {
  try {
    const businessId = await seedFirestoreData();
    return NextResponse.json({ 
      success: true, 
      businessId,
      message: 'Firestore seeded successfully!' 
    });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
