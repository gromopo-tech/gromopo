import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '@/types/jwt-payload';

export default async function MenusLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = (await cookies()).get('__session')?.value;

  if (!token) {
    redirect('/signin');
  }

  // Decode JWT to get custom claims
  const decoded = jwt.decode(token) as JwtPayload | null;
  const role: string | null = decoded?.role || null;
  if (!role) {
    redirect('/signin');
  }
  if (role !== 'owner' && role !== 'admin') {
    redirect('/dashboard/orders');
  }

  return <>{children}</>;
}
