'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AppSidebar, Field, MyButton, SelectField, Tag } from '@/components/mycellium/ui';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Attendee {
  id: string;
  name: string;
  email: string;
  photo_url: string | null;
  institution: string | null;
  role: string | null;
  career_stage: string | null;
  bio: string | null;
  linkedin_url: string | null;
  google_scholar_url: string | null;
  research_area: string | null;
  research_keywords: string[];
  abstract_summary: string | null;
  goals: string[];
  company_name: string | null;
}

interface MatchProfile {
  id: string;
  name: string;
  photo_url: string | null;
  institution: string | null;
  career_stage: string | null;
  bio: string | null;
  linkedin_url: string | null;
  google_scholar_url: string | null;
  research_area: string | null;
  research_keywords: string[];
}

interface MatchRow {
  id: string;
  score: number;
  shared_keywords: string[];
  shared_areas: string[];
  explanation: string;
  profile: MatchProfile | null;
}

interface FilterOptions {
  researchAreas: string[];
  institutions: string[];
  careerStages: string[];
  roles: string[];
  keywords?: string[];
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
}

type NetworkPerson = {
  id: string;
  name: string;
  email?: string;
  photo_url: string | null;
  institution: string | null;
  role: string | null;
  career_stage: string | null;
  bio: string | null;
  linkedin_url: string | null;
  google_scholar_url: string | null;
  research_area: string | null;
  research_keywords: string[];
  abstract_summary?: string | null;
  goals: string[];
  company_name?: string | null;
  score?: number;
  explanation?: string;
  sharedInterests: string[];
};

const NODE_POSITIONS = [
  { x: 52, y: 46, size: 88 },
  { x: 23, y: 51, size: 54 },
  { x: 27, y: 71, size: 54 },
  { x: 39, y: 88, size: 54 },
  { x: 72, y: 19, size: 54 },
  { x: 50, y: 31, size: 54 },
  { x: 72, y: 79, size: 54 },
  { x: 88, y: 62, size: 54 },
  { x: 14, y: 30, size: 54 },
  { x: 52, y: 63, size: 54 },
  { x: 77, y: 33, size: 54 },
  { x: 36, y: 22, size: 54 },
];

const EDGES = [
  [0, 1],
  [0, 2],
  [0, 5],
  [0, 7],
  [0, 9],
  [1, 8],
  [2, 3],
  [3, 6],
  [4, 5],
  [4, 10],
  [5, 10],
  [6, 7],
  [8, 11],
];

const DEMO_PEOPLE: NetworkPerson[] = [
  {
    id: 'demo-sc',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    photo_url: null,
    institution: 'Caltech',
    role: 'Senior Scientist',
    career_stage: 'senior_researcher',
    bio: 'Works on regenerative medicine and aging biology.',
    linkedin_url: null,
    google_scholar_url: null,
    research_area: 'Regenerative Medicine',
    research_keywords: ['regenerative medicine', 'senolytics', 'stem cells'],
    abstract_summary: null,
    goals: ['Knowledge', 'Collaboration'],
    score: 0.89,
    explanation: 'Same institution with adjacent research in regenerative medicine. Possible synergies with aging research.',
    sharedInterests: ['Caltech', 'Partnership'],
  },
  ...['Oscar Peterson', 'Camila Diaz', 'Eli Fisher', 'Iris Jiang', 'Quinn Rivera', 'Mina Novak', 'Kai Li', 'Ava Brooks'].map((name, index) => ({
    id: `demo-${index}`,
    name,
    email: undefined,
    photo_url: null,
    institution: index % 2 === 0 ? 'Caltech' : 'UCI',
    role: index % 3 === 0 ? 'Academic Researcher' : 'Biotech Founder',
    career_stage: index % 2 === 0 ? 'early_career_researcher' : 'mid_career_researcher',
    bio: 'Demo profile shown while the attendee API is unavailable.',
    linkedin_url: null,
    google_scholar_url: null,
    research_area: ['Senolytics', 'Biomarkers', 'Gene Therapy'][index % 3] ?? 'Senolytics',
    research_keywords: ['senolytics', 'biomarkers', 'collaboration'],
    abstract_summary: null,
    goals: ['Knowledge', 'Collaboration'],
    score: Math.max(0.62, 0.84 - index * 0.03),
    explanation: 'Shared research keywords and overlapping conference goals make this a promising introduction.',
    sharedInterests: ['Knowledge', 'Collaboration'],
  })),
];

export default function DirectoryPage() {
  const router = useRouter();
  const [view, setView] = useState<'directory' | 'matches'>('directory');
  const [showFilters, setShowFilters] = useState(true);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({ researchAreas: [], institutions: [], careerStages: [], roles: [] });
  const [meta, setMeta] = useState<Meta>({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [selected, setSelected] = useState<NetworkPerson | null>(null);
  const [drawerMode, setDrawerMode] = useState<'match' | 'profile'>('match');
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [matchStatus, setMatchStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [matchesNotice, setMatchesNotice] = useState<string | null>(null);
  const [attendeeApiFailed, setAttendeeApiFailed] = useState(false);

  const [q, setQ] = useState('');
  const [researchArea, setResearchArea] = useState('');
  const [careerStage, setCareerStage] = useState('');
  const [institution, setInstitution] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch(`${API}/api/attendees/filters`)
      .then((response) => response.json())
      .then(({ data }) => setFilters(data ?? { researchAreas: [], institutions: [], careerStages: [], roles: [] }))
      .catch(() => setFilters({ researchAreas: [], institutions: [], careerStages: [], roles: [] }));
  }, []);

  const fetchAttendees = useCallback(async (targetPage = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(targetPage), limit: '12' });
    if (q.trim()) params.set('q', q.trim());
    if (researchArea) params.set('research_area', researchArea);
    if (careerStage) params.set('career_stage', careerStage);
    if (institution) params.set('institution', institution);
    if (role) params.set('role', role);

    try {
      const response = await fetch(`${API}/api/attendees?${params}`);
      if (!response.ok) throw new Error('Attendee request failed');
      const json = await response.json();
      setAttendees(Array.isArray(json.data) ? json.data : []);
      setAttendeeApiFailed(false);
      setMeta({
        page: json.meta?.page ?? targetPage,
        limit: json.meta?.limit ?? 12,
        total: json.meta?.total ?? 0,
        totalPages: json.meta?.totalPages ?? Math.max(1, Math.ceil((json.meta?.total ?? 0) / (json.meta?.limit ?? 12))),
      });
    } catch {
      setAttendees([]);
      setAttendeeApiFailed(true);
      setMeta({ page: targetPage, limit: 12, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [careerStage, institution, page, q, researchArea, role]);

  const fetchMatches = useCallback(async () => {
    setMatchesLoading(true);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setMatches([]);
      setMatchesNotice('Sign in to see ranked matches. Directory browsing is still available.');
      setMatchesLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API}/api/matches?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      const rows = response.ok && Array.isArray(json.data) ? json.data : [];
      setMatches(rows);
      setMatchesNotice(rows.length ? null : 'No ranked matches yet. Showing the directory network for now.');
    } catch {
      setMatches([]);
      setMatchesNotice('Matches could not be loaded. Showing the directory network for now.');
    } finally {
      setMatchesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendees(page);
  }, [fetchAttendees, page]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const directoryPeople = useMemo(() => attendees.map(attendeeToPerson), [attendees]);
  const matchPeople = useMemo(() => matches.map(matchToPerson).filter((person): person is NetworkPerson => Boolean(person)), [matches]);
  const fallbackPeople = attendeeApiFailed && !loading ? DEMO_PEOPLE : [];
  const people = view === 'matches' && matchPeople.length > 0 ? matchPeople : directoryPeople.length > 0 ? directoryPeople : fallbackPeople;
  const isGraphLoading = view === 'matches' ? matchesLoading && !matchPeople.length : loading;

  const search = () => {
    setPage(1);
    fetchAttendees(1);
  };

  const clearFilters = () => {
    setQ('');
    setResearchArea('');
    setCareerStage('');
    setInstitution('');
    setRole('');
    setPage(1);
  };

  const openPerson = (person: NetworkPerson) => {
    setSelected(person);
    setDrawerMode(typeof person.score === 'number' ? 'match' : 'profile');
    setMatchStatus('idle');
  };

  const recordConnect = async () => {
    if (!selected) return;
    if (selected.id.startsWith('demo-')) {
      setMatchStatus('connected');
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      router.push('/login');
      return;
    }

    setMatchStatus('connecting');
    try {
      const response = await fetch(`${API}/api/matches/swipe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetId: selected.id, action: 'connect' }),
      });
      setMatchStatus(response.ok ? 'connected' : 'error');
    } catch {
      setMatchStatus('error');
    }
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="md:flex">
        <AppSidebar view={view} onViewChange={setView} />

        <section className="min-h-screen flex-1 px-5 py-6 lg:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold leading-tight">Research Network</h1>
              <p className="mt-2 text-sm text-zinc-500">
                {view === 'matches' && matchPeople.length > 0
                  ? 'Ranked matches from your profile signals'
                  : 'Browse attendees by research area, institution, and goals'}
              </p>
            </div>

            <label className="flex items-center gap-3 self-start text-lg font-medium text-zinc-400 sm:self-auto">
              <span>Show Filters</span>
              <button
                type="button"
                role="switch"
                aria-checked={showFilters}
                onClick={() => setShowFilters((value) => !value)}
                className={`relative h-[31px] w-[51px] rounded-full transition ${showFilters ? 'bg-[#4a9b8e]' : 'bg-zinc-200'}`}
              >
                <span
                  className={`absolute top-0.5 h-[27px] w-[27px] rounded-full bg-white shadow transition ${
                    showFilters ? 'left-[22px]' : 'left-0.5'
                  }`}
                />
              </button>
            </label>
          </header>

          <div className={`mt-6 grid grid-cols-1 gap-6 ${showFilters ? 'xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]' : ''}`}>
            {showFilters && (
              <FilterPanel
                view={view}
                setView={setView}
                q={q}
                setQ={setQ}
                researchArea={researchArea}
                setResearchArea={setResearchArea}
                careerStage={careerStage}
                setCareerStage={setCareerStage}
                institution={institution}
                setInstitution={setInstitution}
                role={role}
                setRole={setRole}
                filters={filters}
                onSearch={search}
                onClear={clearFilters}
                count={view === 'matches' && matchPeople.length > 0 ? matchPeople.length : directoryPeople.length || fallbackPeople.length || meta.total}
              />
            )}

            <section className="relative min-h-[560px] overflow-hidden bg-white">
              <NetworkNotice
                show={attendeeApiFailed || (view === 'matches' && Boolean(matchesNotice))}
                text={attendeeApiFailed ? 'Attendee API is unavailable. Demo profiles are shown so the network stays usable.' : matchesNotice}
              />

              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
                <NetworkGraph people={people} loading={isGraphLoading} selectedId={selected?.id} onSelect={openPerson} />
                <PeopleList people={people} loading={isGraphLoading} selectedId={selected?.id} onSelect={openPerson} />
              </div>

              {view === 'directory' && (meta.totalPages ?? 1) > 1 && (
                <div className="mx-auto mt-4 flex w-max items-center gap-3 rounded-full border border-zinc-200 bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                    className="text-sm font-medium text-[#0b2e28] disabled:text-zinc-300"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-zinc-500">
                    Page {meta.page} of {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(meta.totalPages ?? 1, current + 1))}
                    disabled={page >= (meta.totalPages ?? 1)}
                    className="text-sm font-medium text-[#0b2e28] disabled:text-zinc-300"
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>

      {selected && (
        <ProfileDrawer
          person={selected}
          mode={drawerMode}
          setMode={setDrawerMode}
          onClose={() => setSelected(null)}
          onMessage={recordConnect}
          matchStatus={matchStatus}
        />
      )}
    </main>
  );
}

function NetworkNotice({ show, text }: { show: boolean; text: string | null }) {
  if (!show || !text) return null;

  return (
    <div className="mb-4 rounded border border-[#b8cac7] bg-[#f4faf8] px-4 py-3 text-sm leading-5 text-[#195c52]">
      {text}
    </div>
  );
}

function FilterPanel(props: {
  view: 'directory' | 'matches';
  setView: (view: 'directory' | 'matches') => void;
  q: string;
  setQ: (value: string) => void;
  researchArea: string;
  setResearchArea: (value: string) => void;
  careerStage: string;
  setCareerStage: (value: string) => void;
  institution: string;
  setInstitution: (value: string) => void;
  role: string;
  setRole: (value: string) => void;
  filters: FilterOptions;
  onSearch: () => void;
  onClear: () => void;
  count: number;
}) {
  return (
    <aside className="border-zinc-100 bg-white xl:min-h-[calc(100vh-120px)]">
      <div className="space-y-7">
        <div>
          <div className="mb-4 inline-flex border-b border-zinc-200">
            {(['directory', 'matches'] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => props.setView(item)}
                className={`h-11 px-4 text-sm capitalize ${
                  props.view === item ? 'border-b border-zinc-900 text-black' : 'text-zinc-500 hover:text-black'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <Field
            value={props.q}
            onChange={(event) => props.setQ(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') props.onSearch();
            }}
            placeholder="Search by name, keyword, bio..."
          />
        </div>

        <div className="space-y-5">
          <SelectField label="Research Area" value={props.researchArea} onChange={(event) => props.setResearchArea(event.target.value)}>
            <option value="">All research areas</option>
            {props.filters.researchAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </SelectField>

          <SelectField label="Career Stage" value={props.careerStage} onChange={(event) => props.setCareerStage(event.target.value)}>
            <option value="">All career stages</option>
            {props.filters.careerStages.map((stage) => (
              <option key={stage} value={stage}>
                {formatStage(stage)}
              </option>
            ))}
          </SelectField>

          <SelectField label="Institution" value={props.institution} onChange={(event) => props.setInstitution(event.target.value)}>
            <option value="">All institutions</option>
            {props.filters.institutions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>

          <SelectField label="Role" value={props.role} onChange={(event) => props.setRole(event.target.value)}>
            <option value="">All roles</option>
            {props.filters.roles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MyButton onClick={props.onSearch}>Search</MyButton>
          <MyButton variant="secondary" onClick={props.onClear}>
            Clear
          </MyButton>
        </div>

        <p className="text-sm text-zinc-500">{props.count} people found</p>
      </div>
    </aside>
  );
}

function PeopleList({
  people,
  loading,
  selectedId,
  onSelect,
}: {
  people: NetworkPerson[];
  loading: boolean;
  selectedId?: string;
  onSelect: (person: NetworkPerson) => void;
}) {
  if (loading) {
    return (
      <aside className="hidden xl:block">
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-[92px] animate-pulse rounded-lg border border-zinc-100 bg-zinc-50" />
          ))}
        </div>
      </aside>
    );
  }

  if (!people.length) return null;

  return (
    <aside className="xl:max-h-[calc(100vh-154px)] xl:overflow-y-auto xl:pr-1">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase text-zinc-400">People</h2>
        <span className="text-xs text-zinc-400">{people.length} shown</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        {people.slice(0, 12).map((person) => {
          const selected = selectedId === person.id;
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => onSelect(person)}
              className={`rounded-lg border bg-white p-3 text-left transition hover:border-[#4a9b8e] hover:bg-[#f4faf8] ${
                selected ? 'border-[#4a9b8e] shadow-[0_0_0_1px_#4a9b8e]' : 'border-zinc-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#deefec] text-sm font-semibold text-[#195c52]">
                  {initials(person.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-black">{person.name}</p>
                    {typeof person.score === 'number' && (
                      <span className="rounded-full bg-[#195c52] px-2 py-0.5 text-[10px] font-bold text-white">
                        {formatScore(person.score)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">
                    {[person.role, person.institution, person.research_area].filter(Boolean).join(' - ') || formatStage(person.career_stage)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function NetworkGraph({
  people,
  loading,
  selectedId,
  onSelect,
}: {
  people: NetworkPerson[];
  loading: boolean;
  selectedId?: string;
  onSelect: (person: NetworkPerson) => void;
}) {
  const nodes = people.slice(0, NODE_POSITIONS.length);

  if (loading) {
    return <div className="flex h-[560px] items-center justify-center text-sm text-zinc-500">Loading network...</div>;
  }

  if (!nodes.length) {
    return (
      <div className="flex h-[560px] items-center justify-center text-center">
        <div>
          <p className="text-lg font-semibold text-zinc-900">No people found</p>
          <p className="mt-1 text-sm text-zinc-500">Try a different search term or clear filters.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-auto h-[560px] w-full max-w-[760px] md:h-[calc(100vh-150px)] md:min-h-[640px]">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {EDGES.filter(([a, b]) => a < nodes.length && b < nodes.length).map(([a, b]) => {
          const from = NODE_POSITIONS[a]!;
          const to = NODE_POSITIONS[b]!;
          return <line key={`${a}-${b}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#b8cac7" strokeWidth="0.45" />;
        })}
      </svg>

      {nodes.map((person, index) => {
        const position = NODE_POSITIONS[index]!;
        const isSelected = selectedId === person.id;
        const isPrimary = index === 0;
        return (
          <button
            key={`${person.id}-${index}`}
            type="button"
            onClick={() => onSelect(person)}
            className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-center font-semibold shadow-sm transition hover:scale-105 ${
              isPrimary ? 'bg-[#195c52] text-white' : index % 3 === 0 ? 'bg-[#deefec] text-[#4a9b8e]' : 'bg-[#9fd5cd] text-[#195c52]'
            } ${isSelected ? 'ring-4 ring-[#4a9b8e]/25' : ''}`}
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: position.size,
              height: position.size,
              fontSize: isPrimary ? 28 : 18,
            }}
            title={person.name}
          >
            {initials(person.name)}
            {typeof person.score === 'number' && (
              <span className="absolute -right-3 -top-2 rounded-full bg-[#195c52] px-2 py-1 text-[11px] font-bold text-white">
                {formatScore(person.score)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ProfileDrawer({
  person,
  mode,
  setMode,
  onClose,
  onMessage,
  matchStatus,
}: {
  person: NetworkPerson;
  mode: 'match' | 'profile';
  setMode: (mode: 'match' | 'profile') => void;
  onClose: () => void;
  onMessage: () => void;
  matchStatus: 'idle' | 'connecting' | 'connected' | 'error';
}) {
  const hasMatchSummary = typeof person.score === 'number';

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]" onClick={onClose}>
      <aside
        className="absolute bottom-0 right-0 top-auto flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-[#fefefe] shadow-2xl sm:right-6 sm:top-16 sm:h-[calc(100vh-96px)] sm:max-h-none sm:w-[445px] sm:rounded-t-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-5 px-6 py-7">
          {person.photo_url ? (
            <img src={person.photo_url} alt={person.name} className="h-[77px] w-[81px] rounded-full object-cover" />
          ) : (
            <div className="flex h-[77px] w-[81px] items-center justify-center rounded-full bg-[#deefec] text-xl font-semibold text-[#195c52]">
              {initials(person.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-2xl font-bold leading-tight text-black">{person.name}</h2>
            <p className="mt-2 text-base leading-7 text-black">
              {[person.role, person.institution].filter(Boolean).join(' - ') || formatStage(person.career_stage)}
            </p>
          </div>
          <button type="button" aria-label="Close profile" onClick={onClose} className="text-xl text-zinc-400 hover:text-zinc-700">
            x
          </button>
        </div>

        <div className="flex-1 overflow-y-auto border-t border-zinc-200 px-6 py-6">
          {mode === 'match' && hasMatchSummary ? (
            <div className="space-y-4">
              <div className="rounded-[15px] bg-[#deefec] px-5 py-3 text-center text-[#195c52]">
                <p className="text-4xl font-semibold leading-tight">{typeof person.score === 'number' ? formatScore(person.score) : '76%'}</p>
                <p className="text-base">Match Score</p>
              </div>

              <DrawerSection title="Why you're matched">
                <p className="text-sm leading-6">
                  {person.explanation || 'Shared research signals and complementary conference goals make this a useful person to meet.'}
                </p>
              </DrawerSection>

              <DrawerSection title="Shared Interests">
                <div className="flex flex-wrap gap-2">
                  {(person.sharedInterests.length ? person.sharedInterests : person.research_keywords.slice(0, 3)).map((item) => (
                    <Tag key={item}>{formatKeyword(item)}</Tag>
                  ))}
                </div>
              </DrawerSection>

              <DrawerSection title="Career Stage">
                <p className="text-base leading-7">{formatStage(person.career_stage)}</p>
              </DrawerSection>

              <DrawerSection title="Conference Goals">
                <div className="flex flex-wrap gap-2">
                  {(person.goals.length ? person.goals : ['Knowledge', 'Collaboration']).slice(0, 4).map((goal) => (
                    <Tag key={goal}>{goal}</Tag>
                  ))}
                </div>
              </DrawerSection>

              <DrawerSection title="Availability Overlap">
                <div className="flex flex-wrap gap-2">
                  <Tag>Day 1</Tag>
                  <Tag>Day 2</Tag>
                </div>
              </DrawerSection>
            </div>
          ) : (
            <div className="space-y-4">
              <DrawerSection title="Research Area">
                <p className="text-base leading-7">{person.research_area || 'Not specified'}</p>
              </DrawerSection>
              {person.bio && (
                <DrawerSection title="Bio">
                  <p className="text-base leading-7">{person.bio}</p>
                </DrawerSection>
              )}
              {person.abstract_summary && (
                <DrawerSection title="Abstract">
                  <p className="text-base leading-7">{person.abstract_summary}</p>
                </DrawerSection>
              )}
              <DrawerSection title="Keywords">
                <div className="flex flex-wrap gap-2">
                  {person.research_keywords.slice(0, 10).map((keyword) => (
                    <Tag key={keyword}>{formatKeyword(keyword)}</Tag>
                  ))}
                </div>
              </DrawerSection>
              <DrawerSection title="Links">
                <div className="flex flex-wrap gap-2">
                  {person.linkedin_url && (
                    <a href={person.linkedin_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#2563eb] underline">
                      LinkedIn
                    </a>
                  )}
                  {person.google_scholar_url && (
                    <a href={person.google_scholar_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#2563eb] underline">
                      Google Scholar
                    </a>
                  )}
                  {!person.linkedin_url && !person.google_scholar_url && <p className="text-sm text-zinc-500">No public links listed.</p>}
                </div>
              </DrawerSection>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-zinc-100 bg-white px-5 py-4">
          <MyButton
            variant="ghost"
            onClick={() => setMode(mode === 'match' ? 'profile' : 'match')}
            disabled={!hasMatchSummary}
          >
            {mode === 'match' ? 'Full Profile' : 'Match Summary'}
          </MyButton>
          <MyButton onClick={onMessage} disabled={matchStatus === 'connecting' || matchStatus === 'connected'}>
            {matchStatus === 'connecting' ? 'Connecting...' : matchStatus === 'connected' ? 'Connected' : matchStatus === 'error' ? 'Try Again' : 'Message'}
          </MyButton>
        </div>
      </aside>
    </div>
  );
}

function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-base font-semibold leading-6 text-black">{title}</h3>
      <div className="text-black">{children}</div>
    </section>
  );
}

function attendeeToPerson(attendee: Attendee): NetworkPerson {
  return {
    ...attendee,
    sharedInterests: attendee.research_keywords ?? [],
  };
}

function matchToPerson(match: MatchRow): NetworkPerson | null {
  if (!match.profile) return null;
  return {
    id: match.profile.id,
    name: match.profile.name,
    photo_url: match.profile.photo_url,
    institution: match.profile.institution,
    role: null,
    career_stage: match.profile.career_stage,
    bio: match.profile.bio,
    linkedin_url: match.profile.linkedin_url,
    google_scholar_url: match.profile.google_scholar_url,
    research_area: match.profile.research_area,
    research_keywords: match.profile.research_keywords ?? [],
    goals: [],
    score: match.score,
    explanation: match.explanation,
    sharedInterests: [...(match.shared_keywords ?? []), ...(match.shared_areas ?? [])],
  };
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? 'M').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

function formatStage(stage: string | null | undefined) {
  if (!stage) return 'Not specified';
  return stage.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatKeyword(keyword: string) {
  return keyword.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatScore(score: number) {
  return `${Math.round(score * 100)}%`;
}
