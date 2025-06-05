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

  let redirect_path = null;
  try {
    // Decode JWT to get custom claims
    const decoded: any = jwt.decode(token);
    const role = decoded?.role;
    if (role !== 'owner' && role !== 'admin') {
      redirect_path = '/dashboard';
    }
  } catch (err) {
    console.error('Auth failed:', err, err instanceof Error ? err.message : err);
    redirect('/signin');
  } finally {
    if (redirect_path) {
      redirect(redirect_path);
    } else {
      return <>{children}</>;
    }
  }
}
