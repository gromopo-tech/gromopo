"use client";

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { handlePasswordReset } from '@/lib/firebase/actions';
import { auth } from '@/lib/firebase/config';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;
    
    try {
      await handlePasswordReset(auth, oobCode, password);
      setMessage('Password reset successfully! You can now sign in.');
    } catch (error) {
      setMessage('Error resetting password. The link may have expired.');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow mt-10">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="w-full p-2 border rounded mb-4"
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Reset Password
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}