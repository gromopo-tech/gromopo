import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { BusinessIdContextProvider, RoleContextProvider } from './context';

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
  const decoded: any = jwt.decode(token);
  const role: string | null = decoded?.role || null;
  const businessId: string | null = decoded?.businessId || null;

  return (
    <RoleContextProvider role={role}>
      <BusinessIdContextProvider businessId={businessId}>
        {children}
      </BusinessIdContextProvider>
    </RoleContextProvider>
  );
}
