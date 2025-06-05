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
    if (!['owner', 'admin', 'taker', 'maker'].includes(role)) {
      redirect_path = '/signin';
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
