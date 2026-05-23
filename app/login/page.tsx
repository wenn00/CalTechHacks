'use client';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else router.push('/onboarding');
    setLoading(false);
  };

  const handleMagicLink = async () => {
    if (!email) { alert('Enter your email first'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) alert(error.message);
    else alert('Check your email for the login link!');
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <form onSubmit={handlePasswordLogin} className="p-8 bg-white shadow-md rounded-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-4">Login to ARDD Assistant</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-3"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 mb-2"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <button
          type="button"
          onClick={handleMagicLink}
          disabled={loading}
          className="w-full bg-gray-100 text-gray-700 p-2 rounded hover:bg-gray-200 text-sm disabled:opacity-50"
        >
          Send Magic Link instead
        </button>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-center text-gray-500 mb-2">DEV MODE ONLY</p>
            <Link
              href="/onboarding?mock=true"
              className="block w-full text-center bg-gray-100 text-gray-700 p-2 rounded hover:bg-gray-200 text-sm font-semibold"
            >
              Skip to Onboarding (Mock Data)
            </Link>
          </div>
        )}
      </form>
    </div>
  );
}
