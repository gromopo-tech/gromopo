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

  // All context providers are now handled in root layout
  return <>{children}</>;
}
