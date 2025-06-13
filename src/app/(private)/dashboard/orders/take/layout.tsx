import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export default async function TakeLayout({
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
  const role = decoded?.role;
  if (role === 'maker') {
    redirect('/make');
  }

  return <>{children}</>;
}
