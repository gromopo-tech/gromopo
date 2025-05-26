import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getRequesterDataFromToken } from '@/lib/adminGetUserData';

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
    const req = new Request('http://placeholder', { headers: { Authorization: `Bearer ${token}` } });
    const { userData } = await getRequesterDataFromToken(req);
    const role = userData?.role;
    
    if (['taker'].includes(role)) {
      redirect_path = '/take';
    } else if (['maker'].includes(role)) {
      redirect_path = '/make';
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
