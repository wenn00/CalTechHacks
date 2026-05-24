'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Resolve a friendly display name: profiles.name (user's onboarding choice) wins;
  // fall back to OAuth metadata or email username while the profile query is loading
  // / if the user hasn't onboarded yet.
  useEffect(() => {
    if (!user) {
      setDisplayName(null);
      return;
    }
    const metaName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined);
    setDisplayName(metaName ?? user.email?.split('@')[0] ?? null);

    let cancelled = false;
    supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.name) {
          setDisplayName(data.name);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Figma-driven screens provide their own navigation/chrome.
  if (
    pathname === '/login' ||
    pathname?.startsWith('/onboarding') ||
    pathname === '/directory' ||
    pathname === '/schedule' ||
    pathname === '/map'
  ) return null;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
      <Link href="/" className="font-bold text-gray-900 text-lg">🧬 ARDD 2026</Link>
      <Link href="/directory" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Attendee Directory</Link>
      {user && (
        <Link href="/messages" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Messages</Link>
      )}
      <Link href="/onboarding" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Onboarding</Link>
      <div className="ml-auto flex items-center gap-3">
        {loading ? (
          <span className="text-gray-400 text-sm">…</span>
        ) : user ? (
          <>
            <span className="text-sm text-gray-700 hidden md:inline">
              Hi, <strong>{displayName ?? user.email}</strong>
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg font-medium hover:bg-gray-200"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
}
