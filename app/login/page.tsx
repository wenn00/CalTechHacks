'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Field, MyButton } from '@/components/mycellium/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [intent, setIntent] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    });
    if (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  const handleSendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setNotice('');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/onboarding`,
        shouldCreateUser: intent === 'signup',
      },
    });
    if (error) {
      alert(error.message);
    } else {
      setStep('code');
      setNotice(`We sent a six digit code to ${email.trim()}.`);
    }
    setLoading(false);
  };

  const handleVerifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setNotice('');
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: 'email',
    });
    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }
    window.location.href = '/onboarding';
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[38%_62%]">
        <section className="relative min-h-[300px] overflow-hidden bg-[#0b2e28] text-white lg:min-h-screen">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: "url('/mycellium/mushroom-bg.png')" }}
          />
          <div className="absolute inset-0 bg-[#0b2e28]/70" />
          <div className="relative z-10 flex min-h-[300px] flex-col justify-between p-8 lg:min-h-screen lg:p-12">
            <div>
              <img src="/mycellium/logo.png" alt="Mycellium" className="mb-5 h-14 w-14 object-contain object-left" />
              <h1 className="text-3xl font-semibold leading-tight">Mycellium</h1>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/90">
                {intent === 'signin' ? 'Sign in to access your conference dashboard.' : 'Create your conference profile with a secure email code.'}
              </p>
            </div>
            <p className="hidden text-center text-xs text-white/85 lg:block">(c) Mycellium. All Rights Reserved</p>
          </div>
        </section>

        <section className="flex items-center justify-center px-6 py-10 lg:px-14">
          <div className="w-full max-w-[640px] rounded-lg border border-zinc-200 bg-white px-6 py-8 shadow-sm sm:px-8 lg:px-12 lg:py-14">
            <div className="mb-10 flex justify-center">
              <img src="/mycellium/logo.png" alt="Mycellium" className="h-24 w-72 object-contain" />
            </div>

            <div className="mb-7 grid grid-cols-2 rounded-lg bg-zinc-100 p-1">
              {(['signin', 'signup'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setIntent(item);
                    setStep('email');
                    setCode('');
                    setNotice('');
                  }}
                  className={`h-10 rounded-md text-sm font-semibold transition ${
                    intent === item ? 'bg-white text-[#0b2e28] shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                  }`}
                >
                  {item === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              ))}
            </div>

            <form className="space-y-7" onSubmit={step === 'email' ? handleSendCode : handleVerifyCode}>
              <Field
                label="Email"
                requiredMark
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="chockals@uci.edu"
                autoComplete="email"
                disabled={loading || step === 'code'}
                required
              />

              {notice && (
                <div aria-live="polite" className="-mt-3 rounded border border-[#b8cac7] bg-[#f4faf8] px-4 py-3 text-sm text-[#195c52]">
                  {notice}
                </div>
              )}

              {step === 'code' ? (
                <div>
                  <Field
                    label="Login code"
                    requiredMark
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="text-center font-mono text-2xl tracking-[0.45em]"
                    autoFocus
                    required
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setCode('');
                        setNotice('');
                      }}
                      className="text-sm text-[#2563eb] underline"
                    >
                      Use a different email
                    </button>
                  </div>
                </div>
              ) : (
                <p className="-mt-3 text-right text-sm text-zinc-500">No password required</p>
              )}

              <MyButton
                type="submit"
                className="h-14 w-full text-lg"
                disabled={loading || !email.trim() || (step === 'code' && code.length !== 6)}
              >
                {loading ? (step === 'email' ? 'Sending...' : 'Verifying...') : step === 'email' ? 'Continue' : 'Verify Code'}
              </MyButton>
            </form>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-4 flex h-14 w-full items-center justify-center rounded border border-zinc-200 bg-white px-6 text-base font-medium text-[#061c2a] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <img src="/mycellium/google.png" alt="" className="mr-3 h-5 w-5" />
              Sign in with Google
            </button>

            <p className="mt-5 text-center text-sm text-zinc-400">
              {intent === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setIntent(intent === 'signin' ? 'signup' : 'signin');
                  setStep('email');
                  setCode('');
                  setNotice('');
                }}
                className="text-[#061c2a] underline"
              >
                {intent === 'signin' ? 'Create one.' : 'Sign in.'}
              </button>
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 border-t border-zinc-100 pt-5">
                <p className="mb-2 text-center text-xs font-medium uppercase text-zinc-400">Dev mode only</p>
                <Link
                  href="/onboarding?mock=true"
                  className="block w-full rounded bg-zinc-100 p-3 text-center text-sm font-semibold text-zinc-700 hover:bg-zinc-200"
                >
                  Skip to onboarding with mock data
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
