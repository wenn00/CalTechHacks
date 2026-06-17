'use client';

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const navIconClass = 'h-5 w-5';
type SidebarSection = 'directory' | 'matches' | 'schedule' | 'messages' | 'map' | 'videos' | 'profile';

type BrandRailProps = {
  children?: ReactNode;
  className?: string;
};

export function BrandRail({ children, className = '' }: BrandRailProps) {
  return (
    <aside
      className={`relative flex min-h-[180px] overflow-hidden bg-[#0b2e28] text-white md:min-h-screen md:w-[184px] lg:w-[260px] ${className}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url('/mycellium/mushroom-bg.png')" }}
      />
      <div className="absolute inset-0 bg-[#0b2e28]/70" />
      <div className="relative z-10 flex w-full flex-col justify-between p-8 md:p-9">
        <img src="/mycellium/logo.png" alt="Mycellium" className="h-16 w-36 object-contain object-left md:h-20 md:w-44" />
        {children}
      </div>
    </aside>
  );
}

type AppSidebarProps = {
  view?: 'directory' | 'matches';
  onViewChange?: (view: 'directory' | 'matches') => void;
  activeSection?: SidebarSection;
};

type SidebarProfile = {
  name: string | null;
  email: string | null;
  institution: string | null;
  role: string | null;
  career_stage: string | null;
};

export function AppSidebar({ view = 'directory', onViewChange, activeSection }: AppSidebarProps) {
  const router = useRouter();
  const active = activeSection ?? view;
  const accountRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [profile, setProfile] = useState<SidebarProfile>({
    name: null,
    email: null,
    institution: null,
    role: null,
    career_stage: null,
  });

  const openNetworkView = (nextView: 'directory' | 'matches') => {
    if (onViewChange) {
      onViewChange(nextView);
      return;
    }
    router.push(nextView === 'matches' ? '/directory?view=matches' : '/directory');
  };

  useEffect(() => {
    setCollapsed(window.localStorage.getItem('mycellium-sidebar-collapsed') === 'true');
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setProfile({ name: null, email: null, institution: null, role: null, career_stage: null });
        return;
      }

      const fallbackName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email?.split('@')[0] ??
        null;

      const { data } = await supabase
        .from('profiles')
        .select('name, email, institution, role, career_stage')
        .eq('id', user.id)
        .maybeSingle();

      setProfile({
        name: (data?.name as string | null | undefined) ?? fallbackName,
        email: (data?.email as string | null | undefined) ?? user.email ?? null,
        institution: (data?.institution as string | null | undefined) ?? null,
        role: (data?.role as string | null | undefined) ?? null,
        career_stage: (data?.career_stage as string | null | undefined) ?? null,
      });
    }

    loadProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function closeAccount(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    }

    document.addEventListener('mousedown', closeAccount);
    return () => document.removeEventListener('mousedown', closeAccount);
  }, []);

  const displayName = profile.name ?? 'Mycellium attendee';
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const toggleCollapsed = () => {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem('mycellium-sidebar-collapsed', String(next));
      return next;
    });
    setAccountOpen(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAccountOpen(false);
    router.push('/login');
  };

  return (
    <aside
      className={`relative flex border-zinc-200 bg-white transition-[width] md:sticky md:top-0 md:h-screen md:min-h-screen md:border-r ${
        collapsed ? 'md:w-[92px]' : 'md:w-[220px] lg:w-[260px]'
      }`}
    >
      <div
        className={`flex w-full items-center justify-between gap-4 overflow-x-auto px-4 py-3 md:h-full md:flex-col md:items-stretch md:overflow-visible ${
          collapsed ? 'md:p-5' : 'md:p-8'
        }`}
      >
        <div className="flex items-center gap-3 md:flex-col md:items-stretch md:gap-10">
          <img
            src="/mycellium/logo.png"
            alt="Mycellium"
            className={`h-10 object-left transition-[width,height] ${
              collapsed ? 'w-10 object-cover lg:h-10' : 'w-10 object-contain lg:h-20 lg:w-48'
            }`}
          />
          <nav className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-4">
            <SidebarButton
              active={active === 'directory'}
              collapsed={collapsed}
              icon={<HomeIcon />}
              label="Directory"
              onClick={() => openNetworkView('directory')}
            />
            <SidebarButton
              active={active === 'matches'}
              collapsed={collapsed}
              icon={<CompareIcon />}
              label="Matches"
              onClick={() => openNetworkView('matches')}
            />
            <SidebarButton
              active={active === 'schedule'}
              collapsed={collapsed}
              icon={<CalendarIcon />}
              label="Schedule"
              onClick={() => router.push('/schedule')}
            />
            <SidebarButton
              active={active === 'messages'}
              collapsed={collapsed}
              icon={<MessagesIcon />}
              label="Messages"
              onClick={() => router.push('/messages')}
            />
            <SidebarButton
              active={active === 'map'}
              collapsed={collapsed}
              icon={<MapIcon />}
              label="Map"
              onClick={() => router.push('/map')}
            />
            <SidebarButton
              active={active === 'videos'}
              collapsed={collapsed}
              icon={<VideoIcon />}
              label="Video Library"
              onClick={() => router.push('/videos')}
            />
          </nav>
        </div>
        <div ref={accountRef} className={`relative hidden items-center md:flex ${collapsed ? 'flex-col gap-3' : 'justify-between'}`}>
          {accountOpen && (
            <AccountPopover
              collapsed={collapsed}
              displayName={displayName}
              initials={initials}
              profile={profile}
              onOpenProfile={() => {
                setAccountOpen(false);
                router.push('/profile');
              }}
              onSignOut={signOut}
            />
          )}

          <button
            type="button"
            aria-label="Open profile"
            onClick={() => {
              setAccountOpen(false);
              router.push('/profile');
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#deefec] text-sm font-semibold text-[#195c52] transition hover:bg-[#cfe7e3]"
          >
            {initials}
          </button>
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={toggleCollapsed}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[#0b2e28] transition hover:bg-[#eef7f5]"
          >
            <PanelIcon collapsed={collapsed} />
          </button>
        </div>
      </div>
    </aside>
  );
}

type SidebarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  collapsed?: boolean;
  icon: ReactNode;
  label: string;
};

function SidebarButton({ active = false, collapsed = false, icon, label, className = '', ...props }: SidebarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`flex h-14 min-w-14 flex-col items-center justify-center gap-1 rounded-lg px-2 text-[#0b2e28] transition hover:bg-[#eef7f5] disabled:cursor-not-allowed disabled:opacity-45 md:h-12 md:min-w-12 md:flex-row md:gap-3 md:px-3 ${
        collapsed ? 'md:justify-center md:px-3' : 'md:justify-start md:px-4 lg:px-5'
      } ${
        active ? 'bg-[#ddf2ef] font-bold text-[#4a9b8e]' : 'font-semibold'
      } ${className}`}
      {...props}
    >
      {icon}
      <span className={collapsed ? 'hidden' : 'max-w-16 text-center text-[10px] leading-tight md:inline md:max-w-none md:text-left md:text-sm md:leading-normal'}>
        {label}
      </span>
    </button>
  );
}

function AccountPopover({
  collapsed,
  displayName,
  initials,
  profile,
  onOpenProfile,
  onSignOut,
}: {
  collapsed: boolean;
  displayName: string;
  initials: string;
  profile: SidebarProfile;
  onOpenProfile: () => void;
  onSignOut: () => void;
}) {
  const signedIn = Boolean(profile.email);

  return (
    <div
      className={`absolute bottom-14 z-50 w-[286px] rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-xl ${
        collapsed ? 'left-12' : 'left-0'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#deefec] text-sm font-bold text-[#195c52]">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-black">{displayName}</p>
          <p className="truncate text-sm text-zinc-500">{profile.email ?? 'Not signed in'}</p>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <AccountLine label="Institution" value={profile.institution ?? 'Not set'} />
        <AccountLine label="Role" value={profile.role ?? 'Not set'} />
        <AccountLine label="Career Stage" value={formatAccountStage(profile.career_stage)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenProfile}
          className="rounded bg-[#0b2e28] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#08241f]"
        >
          Profile
        </button>
        <button
          type="button"
          onClick={onSignOut}
          disabled={!signedIn}
          className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:text-zinc-300"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function AccountLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-medium text-black">{label}</p>
      <p className="mt-0.5 text-zinc-500">{value}</p>
    </div>
  );
}

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export function MyButton({ variant = 'primary', className = '', ...props }: PrimaryButtonProps) {
  const variants = {
    primary: 'bg-[#0b2e28] text-white hover:bg-[#08241f] disabled:bg-zinc-300 disabled:text-zinc-500',
    secondary: 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 disabled:text-zinc-400',
    ghost: 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:text-zinc-400',
  };
  return (
    <button
      type="button"
      className={`flex h-12 items-center justify-center rounded-[5px] px-6 text-base font-medium transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  requiredMark?: boolean;
};

export function Field({ label, requiredMark = false, className = '', ...props }: FieldProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-medium text-black">
          {label}
          {requiredMark && <span className="ml-1 text-[#991919]">*</span>}
        </span>
      )}
      <input
        className={`h-12 w-full rounded border border-zinc-200 bg-white px-4 text-base text-black outline-none transition placeholder:text-zinc-400 focus:border-[#4a9b8e] focus:ring-2 focus:ring-[#ddf2ef] ${className}`}
        {...props}
      />
    </label>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  requiredMark?: boolean;
};

export function SelectField({ label, requiredMark = false, className = '', children, ...props }: SelectFieldProps) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-medium text-black">
          {label}
          {requiredMark && <span className="ml-1 text-[#991919]">*</span>}
        </span>
      )}
      <select
        className={`h-12 w-full rounded border border-zinc-200 bg-white px-4 text-sm text-zinc-700 outline-none transition focus:border-[#4a9b8e] focus:ring-2 focus:ring-[#ddf2ef] ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

type ChoiceCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  label: string;
};

export function ChoiceCard({ selected = false, label, className = '', ...props }: ChoiceCardProps) {
  return (
    <button
      type="button"
      className={`flex min-h-11 items-center justify-between rounded border px-3 text-left text-sm font-medium transition ${
        selected
          ? 'border-zinc-900 bg-white text-black shadow-[0_0_0_1px_#18181b]'
          : 'border-zinc-200 bg-white text-black hover:border-[#4a9b8e]'
      } ${className}`}
      {...props}
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 items-center justify-center rounded-sm border text-xs ${
          selected ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white'
        }`}
      >
        {selected && (
          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="m3 8 3 3 7-7" />
          </svg>
        )}
      </span>
    </button>
  );
}

export function Tag({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border border-[#4a9b8e] bg-[#deefec] px-2 py-1 text-xs text-[#195c52] ${className}`}>
      {children}
    </span>
  );
}

function HomeIcon() {
  return (
    <svg className={navIconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 10.5 9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg className={navIconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 3h5v5" />
      <path d="M4 20 21 3" />
      <path d="M21 16v5h-5" />
      <path d="M15 15 21 21" />
      <path d="M4 4l5 5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className={navIconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}

function MessagesIcon() {
  return (
    <svg className={navIconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg className={navIconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg className={navIconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="14" height="14" rx="2" />
      <path d="m17 9 4-2v10l-4-2" />
    </svg>
  );
}

function PanelIcon({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <svg className="h-5 w-5 text-[#0b2e28]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d={collapsed ? 'M9 4v16M12 9l3 3-3 3' : 'M9 4v16M15 9l-3 3 3 3'} />
    </svg>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? 'M') + (parts[1]?.[0] ?? '')).toUpperCase();
}

function formatAccountStage(stage: string | null) {
  if (!stage) return 'Not set';
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

// ─── Mycellium branded loader ──────────────────────────────────────────────────

const LOADER_NODES = [
  { cx: 50, cy: 13, delay: '0s' },
  { cx: 80, cy: 31, delay: '0.25s' },
  { cx: 83, cy: 65, delay: '0.5s' },
  { cx: 63, cy: 87, delay: '0.75s' },
  { cx: 37, cy: 87, delay: '1s' },
  { cx: 17, cy: 65, delay: '1.25s' },
  { cx: 20, cy: 31, delay: '1.5s' },
];

export function MycelliumLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-28 w-28" aria-hidden="true">
        {/* Spokes: center → outer nodes */}
        {LOADER_NODES.map((node, i) => (
          <line key={`s${i}`} x1="50" y1="50" x2={node.cx} y2={node.cy}
            stroke="#4a9b8e" strokeWidth="1.2" strokeLinecap="round">
            <animate attributeName="opacity" values="0.15;0.75;0.15"
              dur="2s" begin={node.delay} repeatCount="indefinite" />
          </line>
        ))}
        {/* Ring edges */}
        {LOADER_NODES.map((node, i) => {
          const next = LOADER_NODES[(i + 1) % LOADER_NODES.length]!;
          return (
            <line key={`r${i}`} x1={node.cx} y1={node.cy} x2={next.cx} y2={next.cy}
              stroke="#9fd5cd" strokeWidth="0.7" strokeLinecap="round">
              <animate attributeName="opacity" values="0.1;0.45;0.1"
                dur="2.8s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
            </line>
          );
        })}
        {/* Outer nodes */}
        {LOADER_NODES.map((node, i) => (
          <circle key={`n${i}`} cx={node.cx} cy={node.cy} r="5" fill="#9fd5cd">
            <animate attributeName="r" values="4;6;4" dur="2s" begin={node.delay} repeatCount="indefinite" />
            <animate attributeName="fill" values="#9fd5cd;#4a9b8e;#9fd5cd"
              dur="2s" begin={node.delay} repeatCount="indefinite" />
          </circle>
        ))}
        {/* Center node */}
        <circle cx="50" cy="50" r="10" fill="#195c52">
          <animate attributeName="r" values="8;12;8" dur="2.5s" repeatCount="indefinite" />
        </circle>
        {/* Pulse ring */}
        <circle cx="50" cy="50" r="14" fill="none" stroke="#4a9b8e" strokeWidth="1">
          <animate attributeName="r" values="12;24" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>
      {label && (
        <p className="animate-pulse text-center text-sm font-semibold text-[#195c52]">{label}</p>
      )}
    </div>
  );
}
