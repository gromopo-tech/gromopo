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

  let redirect_path = null;
  try {
    // Decode JWT to get custom claims
    const decoded: any = jwt.decode(token);
    const role = decoded?.role;
    if (role === 'maker') {
      redirect_path = '/make';
    }
  } catch (err) {
    console.error('Auth failed:', err);
    redirect('/signin');
  } finally {
    if (redirect_path) {
      redirect(redirect_path);
    } else {
      return <>{children}</>;
    }
  }
}
