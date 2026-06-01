'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppSidebar, MyButton, Tag } from '@/components/mycellium/ui';
import { supabase } from '@/lib/supabase';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type PublicProfile = {
  id: string;
  name: string;
  email?: string | null;
  photo_url: string | null;
  institution: string | null;
  role: string | null;
  career_stage: string | null;
  bio: string | null;
  linkedin_url: string | null;
  google_scholar_url: string | null;
  research_area: string | null;
  research_keywords: string[] | null;
  abstract_summary: string | null;
  goals: string[] | null;
  company_name?: string | null;
  company_stage?: string | null;
  company_description?: string | null;
};

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const profileId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id ?? null);
    });
  }, []);

  const handleMessage = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) { router.push('/login'); return; }
    setMsgLoading(true);
    try {
      const res = await fetch(`${API}/api/messages/conversations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: profileId }),
      });
      const json = await res.json().catch(() => null);
      const convId = json?.data?.id;
      if (convId) router.push(`/messages?c=${convId}`);
    } finally {
      setMsgLoading(false);
    }
  };

  useEffect(() => {
    async function loadProfile() {
      if (!profileId) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API}/api/attendees/${profileId}`);
        const json = await response.json().catch(() => null);

        if (!response.ok || !json?.data) {
          throw new Error(json?.error ?? 'Profile could not be loaded.');
        }

        setProfile(json.data as PublicProfile);
      } catch {
        setError('This attendee profile is unavailable right now.');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [profileId]);

  const initials = useMemo(() => getInitials(profile?.name ?? 'Attendee'), [profile?.name]);
  const keywords = normalizeList(profile?.research_keywords);
  const goals = normalizeList(profile?.goals);

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="md:flex">
        <AppSidebar activeSection="directory" />

        <section className="min-h-screen flex-1 px-5 py-6 lg:px-8">
          {loading && (
            <div className="flex min-h-[520px] items-center justify-center text-sm text-zinc-500">
              Loading profile...
            </div>
          )}

          {!loading && error && (
            <div className="flex min-h-[520px] items-center justify-center text-center">
              <div>
                <h1 className="text-2xl font-semibold text-black">Profile unavailable</h1>
                <p className="mt-2 text-sm text-zinc-500">{error}</p>
                <MyButton className="mt-5" onClick={() => router.push('/directory')}>
                  Back to Directory
                </MyButton>
              </div>
            </div>
          )}

          {!loading && profile && (
            <>
              <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#4a9b8e]">Attendee Profile</p>
                  <h1 className="mt-2 text-3xl font-semibold leading-tight">{profile.name}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                    {[profile.role, profile.institution].filter(Boolean).join(' - ') || formatStage(profile.career_stage)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {currentUserId && currentUserId !== profileId && (
                    <MyButton className="w-full px-4 text-sm sm:w-auto" onClick={handleMessage} disabled={msgLoading}>
                      {msgLoading ? 'Opening...' : 'Message'}
                    </MyButton>
                  )}
                  <MyButton variant="secondary" className="w-full px-4 text-sm sm:w-auto" onClick={() => router.push('/directory')}>
                    Back to Directory
                  </MyButton>
                </div>
              </header>

              <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <section className="rounded-lg border border-zinc-200 bg-white p-6">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#deefec] text-3xl font-bold text-[#195c52]">
                      {profile.photo_url ? <img src={profile.photo_url} alt="" className="h-full w-full object-cover" /> : initials}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-2xl font-semibold text-black">{profile.name}</h2>
                      <p className="mt-1 text-sm text-zinc-500">{profile.institution ?? 'Institution not listed'}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {profile.role && <Tag>{profile.role}</Tag>}
                        {profile.research_area && <Tag>{profile.research_area}</Tag>}
                        {profile.career_stage && <Tag>{formatStage(profile.career_stage)}</Tag>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    <ProfileField label="Institution" value={profile.institution ?? 'Not listed'} />
                    <ProfileField label="Role" value={profile.role ?? 'Not listed'} />
                    <ProfileField label="Career Stage" value={formatStage(profile.career_stage)} />
                    <ProfileField label="Research Area" value={profile.research_area ?? 'Not listed'} />
                  </div>
                </section>

                <aside className="h-max rounded-lg border border-zinc-200 bg-[#f8fbfa] p-5">
                  <h2 className="text-base font-semibold text-black">Links</h2>
                  <div className="mt-4 space-y-3">
                    {profile.linkedin_url && <ProfileLink href={profile.linkedin_url} label="LinkedIn" />}
                    {profile.google_scholar_url && <ProfileLink href={profile.google_scholar_url} label="Google Scholar" />}
                    {!profile.linkedin_url && !profile.google_scholar_url && <p className="text-sm text-zinc-500">No public links listed.</p>}
                  </div>
                </aside>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                {profile.bio && <ProfileText title="Bio" value={profile.bio} />}
                {profile.abstract_summary && <ProfileText title="Abstract" value={profile.abstract_summary} />}
                <ProfileTags title="Research Keywords" empty="No keywords listed." values={keywords} />
                <ProfileTags title="Conference Goals" empty="No goals listed." values={goals} />
                {(profile.company_name || profile.company_description) && (
                  <ProfileText
                    title="Company"
                    value={[profile.company_name, profile.company_stage, profile.company_description].filter(Boolean).join('\n')}
                  />
                )}
              </div>
            </>
          )}
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

function ProfileText({ title, value }: { title: string; value: string }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="text-base font-semibold text-black">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-700">{value}</p>
    </section>
  );
}

function ProfileTags({ title, empty, values }: { title: string; empty: string; values: string[] }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5">
      <h2 className="text-base font-semibold text-black">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {values.length ? values.map((value) => <Tag key={value}>{formatKeyword(value)}</Tag>) : <p className="text-sm text-zinc-500">{empty}</p>}
      </div>
    </section>
  );
}

function ProfileLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="block rounded border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-[#195c52] transition hover:border-[#4a9b8e]">
      {label}
    </a>
  );
}

function normalizeList(value: string[] | null | undefined) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? 'A') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function formatStage(stage: string | null | undefined) {
  if (!stage) return 'Not listed';
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatKeyword(keyword: string) {
  return keyword.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}
