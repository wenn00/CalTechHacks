'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { AppSidebar, MyButton, Tag } from '@/components/mycellium/ui';
import { supabase } from '@/lib/supabase';

type Profile = {
  name: string | null;
  email: string | null;
  institution: string | null;
  role: string | null;
  career_stage: string | null;
  research_area: string | string[] | null;
  research_keywords: string[] | null;
  goals: string[] | null;
  onboarding_complete: boolean | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user ?? null;

      if (!sessionUser) {
        router.replace('/login');
        return;
      }

      setUser(sessionUser);

      const { data } = await supabase
        .from('profiles')
        .select('name, email, institution, role, career_stage, research_area, research_keywords, goals, onboarding_complete')
        .eq('id', sessionUser.id)
        .maybeSingle();

      setProfile((data as Profile | null) ?? null);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const displayName = profile?.name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? 'Mycellium attendee';
  const initials = useMemo(() => getInitials(displayName), [displayName]);
  const email = profile?.email ?? user?.email ?? 'Not signed in';
  const researchAreas = normalizeList(profile?.research_area);
  const keywords = normalizeList(profile?.research_keywords);
  const goals = normalizeList(profile?.goals);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-black">
        <div className="md:flex">
          <AppSidebar activeSection="profile" />
          <section className="flex min-h-screen flex-1 items-center justify-center px-5 py-6 text-sm text-zinc-500">
            Loading profile...
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="md:flex">
        <AppSidebar activeSection="profile" />

        <section className="min-h-screen flex-1 px-5 py-6 lg:px-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold leading-tight">Profile</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Review your account, research profile, and conference goals.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <MyButton variant="secondary" className="px-4 text-sm" onClick={() => router.push('/onboarding')}>
                Edit Profile
              </MyButton>
              <MyButton variant="ghost" className="px-4 text-sm" onClick={signOut}>
                Sign Out
              </MyButton>
            </div>
          </header>

          <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-lg border border-zinc-200 bg-white p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#deefec] text-2xl font-bold text-[#195c52]">
                  {initials}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-semibold text-black">{displayName}</h2>
                  <p className="mt-1 truncate text-sm text-zinc-500">{email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Tag>{profile?.onboarding_complete ? 'Onboarding complete' : 'Profile incomplete'}</Tag>
                    {profile?.role && <Tag>{profile.role}</Tag>}
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <ProfileField label="Institution" value={profile?.institution ?? 'Not set'} />
                <ProfileField label="Career Stage" value={formatStage(profile?.career_stage)} />
                <ProfileField label="Primary Research Area" value={researchAreas[0] ?? 'Not set'} />
                <ProfileField label="Account ID" value={user?.id ?? 'Not available'} />
              </div>
            </section>

            <aside className="h-max rounded-lg border border-zinc-200 bg-[#f8fbfa] p-5">
              <h2 className="text-base font-semibold text-black">Account</h2>
              <div className="mt-4 space-y-3">
                <ProfileLine label="Name" value={displayName} />
                <ProfileLine label="Email" value={email} />
                <ProfileLine label="Role" value={profile?.role ?? 'Not set'} />
              </div>
            </aside>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <ProfileTags title="Research Areas" empty="No research areas yet." values={researchAreas} />
            <ProfileTags title="Research Keywords" empty="No keywords yet." values={keywords} />
            <ProfileTags title="Conference Goals" empty="No goals yet." values={goals} />
          </div>
        </section>
      </div>
    </main>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-[#f8fbfa] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">{label}</p>
      <p className="mt-2 break-words text-sm font-medium text-black">{value}</p>
    </div>
  );
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-400">{label}</p>
      <p className="mt-1 break-words text-sm text-black">{value}</p>
    </div>
  );
}

function ProfileTags({ title, empty, values }: { title: string; empty: string; values: string[] }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="text-base font-semibold text-black">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {values.length ? values.map((value) => <Tag key={value}>{value}</Tag>) : <p className="text-sm text-zinc-500">{empty}</p>}
      </div>
    </section>
  );
}

function normalizeList(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? 'M') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function formatStage(stage: string | null | undefined) {
  if (!stage) return 'Not set';
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
