'use client';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      alert(error.message);
    } else {
      setStep('code');
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    if (error) {
      alert(error.message);
    } else {
      window.location.href = '/onboarding';
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <form
        onSubmit={step === 'email' ? handleSendCode : handleVerifyCode}
        className="p-8 bg-white shadow-md rounded-lg max-w-md w-full"
      >
        <h1 className="text-2xl font-bold mb-4">Login to Mycellium</h1>

        {step === 'email' ? (
          <>
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              Code sent to <strong>{email}</strong>. Check your inbox for the 6-digit code.
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full p-3 border border-gray-300 rounded mb-4 tracking-[0.5em] text-center font-mono text-2xl"
              required
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
              }}
              className="block mt-3 text-sm text-gray-500 underline mx-auto"
            >
              Use a different email
            </button>
          </>
        )}

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
