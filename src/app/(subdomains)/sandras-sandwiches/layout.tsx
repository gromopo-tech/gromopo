import React from 'react';

export default function SandrasSubdomainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {/* Subdomain-specific header could go here */}
      <header className="bg-yellow-50 border-b border-yellow-200 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-yellow-800">Sandra's Sandwiches</h1>
          <p className="text-yellow-600">Fresh sandwiches made to order</p>
        </div>
      </header>
      
      <main className="min-h-[calc(100vh-120px)]">
        {children}
      </main>
      
      {/* Subdomain-specific footer could go here */}
      <footer className="bg-yellow-50 border-t border-yellow-200 p-4 text-center text-yellow-600">
        <p>&copy; 2025 Sandra's Sandwiches - Powered by GroMoPo</p>
      </footer>
    </div>
  );
}
