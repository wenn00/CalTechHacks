'use client';

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

const navIconClass = 'h-5 w-5';

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
  view: 'directory' | 'matches';
  onViewChange: (view: 'directory' | 'matches') => void;
};

export function AppSidebar({ view, onViewChange }: AppSidebarProps) {
  return (
    <aside className="flex border-zinc-200 bg-white md:sticky md:top-0 md:h-screen md:min-h-screen md:w-[92px] md:border-r lg:w-[260px]">
      <div className="flex w-full items-center justify-between gap-4 overflow-x-auto px-4 py-3 md:h-full md:flex-col md:items-stretch md:overflow-hidden md:p-8">
        <div className="flex items-center gap-3 md:flex-col md:items-stretch md:gap-10">
          <img src="/mycellium/logo.png" alt="Mycellium" className="h-10 w-10 object-contain object-left lg:h-20 lg:w-48" />
          <nav className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-4">
            <SidebarButton
              active={view === 'directory'}
              icon={<HomeIcon />}
              label="Directory"
              onClick={() => onViewChange('directory')}
            />
            <SidebarButton
              active={view === 'matches'}
              icon={<CompareIcon />}
              label="Matches"
              onClick={() => onViewChange('matches')}
            />
            <SidebarButton icon={<CalendarIcon />} label="Schedule" disabled />
            <SidebarButton icon={<MessagesIcon />} label="Messages" disabled />
            <SidebarButton icon={<MapIcon />} label="Map" disabled />
          </nav>
        </div>
        <div className="hidden items-center justify-between lg:flex">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#deefec] text-sm font-semibold text-[#195c52]">
            MC
          </div>
          <PanelIcon />
        </div>
      </div>
    </aside>
  );
}

type SidebarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  icon: ReactNode;
  label: string;
};

function SidebarButton({ active = false, icon, label, className = '', ...props }: SidebarButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`flex h-12 min-w-12 items-center justify-center gap-3 rounded-lg px-3 text-[#0b2e28] transition hover:bg-[#eef7f5] disabled:cursor-not-allowed disabled:opacity-45 lg:justify-start lg:px-5 ${
        active ? 'bg-[#ddf2ef] font-bold text-[#4a9b8e]' : 'font-semibold'
      } ${className}`}
      {...props}
    >
      {icon}
      <span className="hidden whitespace-nowrap lg:inline">{label}</span>
    </button>
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

function PanelIcon() {
  return (
    <svg className="h-5 w-5 text-[#0b2e28]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16M15 9l-3 3 3 3" />
    </svg>
  );
}
