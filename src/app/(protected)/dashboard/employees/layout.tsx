import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export default async function EmployeesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const token = (await cookies()).get('__session')?.value;

  if (!token) {
    redirect('/signin');
  }

  // Decode JWT to get custom claims
  const decoded = jwt.decode(token) as jwt.JwtPayload | null;
  const role: string | null = decoded?.role ? String(decoded.role) : null;
  if (!role) {
    redirect('/signin');
  }
  if (role === 'taker') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
