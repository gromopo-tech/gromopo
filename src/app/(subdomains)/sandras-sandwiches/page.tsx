'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SandrasSubdomainHome() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to /order on the sandras-sandwiches subdomain
    router.replace('/order');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Sandra's Sandwiches</h1>
        <p>Redirecting to order page...</p>
      </div>
    </div>
  );
}
