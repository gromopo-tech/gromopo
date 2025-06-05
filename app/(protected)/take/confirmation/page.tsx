import React from 'react';

export default function ConfirmationPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-black">
      <h1 className="text-3xl font-bold mb-4">Payment Confirmed!</h1>
      <p className="text-lg mb-8">Thank you for your payment. Your order is being processed.</p>
      <a href="/dashboard" className="bg-black text-white px-4 py-2 rounded">Dashboard</a>
    </div>
  );
}
