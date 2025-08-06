import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ContextProviders } from '@/components/business/context-providers';
import { JwtPayload } from '@/types/jwt-payload';

export default async function ProtectedLayout({
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
  const businessId: string | null = decoded?.businessId || null;

  return (
    <ContextProviders role={role} businessId={businessId}>
      {children}
    </ContextProviders>
  );
}
