import jwt from 'jsonwebtoken';
import { ContextProviders } from '@/components/protected/context-providers';
import { JwtPayload } from '@/types/jwt-payload';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = (await cookies()).get('__session')?.value;

  if (!token) {
    redirect('/signin');
  }

  const decoded = jwt.decode(token) as JwtPayload | null;
  const role: string | null = decoded?.role || null;
  const businessId: string | null = decoded?.businessId || null;

  return (
    <ContextProviders role={role} businessId={businessId}>
      {children}
    </ContextProviders>
  );
}
