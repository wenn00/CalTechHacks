'use client';

import { useState } from 'react';
import { AppSidebar, MyButton, Tag } from '@/components/mycellium/ui';

const DAYS = ['Day 1', 'Day 2', 'Day 3'] as const;

const SESSIONS = [
  {
    day: 'Day 1',
    time: '09:00',
    title: 'Longevity therapeutics opening session',
    room: 'Main Hall',
    tags: ['Keynote', 'Therapeutics'],
  },
  {
    day: 'Day 1',
    time: '11:30',
    title: 'Biomarkers for translational aging trials',
    room: 'Room 204',
    tags: ['Biomarkers', 'Clinical'],
  },
  {
    day: 'Day 2',
    time: '10:15',
    title: 'Senolytics and immune modulation',
    room: 'Room 302',
    tags: ['Senolytics', 'Immunology'],
  },
  {
    day: 'Day 2',
    time: '14:00',
    title: 'Founder and investor roundtable',
    room: 'Main Hall',
    tags: ['Fundraising', 'Startups'],
  },
  {
    day: 'Day 3',
    time: '09:45',
    title: 'Gene therapy platforms for age-related disease',
    room: 'Room 208',
    tags: ['Gene Therapy', 'Platforms'],
  },
  {
    day: 'Day 3',
    time: '13:30',
    title: 'Collaboration matchmaking block',
    room: 'Networking Lounge',
    tags: ['Networking', 'Collaboration'],
  },
];

export default function SchedulePage() {
  const [day, setDay] = useState<(typeof DAYS)[number]>('Day 1');
  const [selected, setSelected] = useState<string[]>([]);
  const visibleSessions = SESSIONS.filter((session) => session.day === day);

  const toggleSession = (title: string) => {
    setSelected((current) => (current.includes(title) ? current.filter((item) => item !== title) : [...current, title]));
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="md:flex">
        <AppSidebar activeSection="schedule" />

        <section className="min-h-screen flex-1 px-5 py-6 lg:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold leading-tight">Schedule</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Build a lightweight agenda from recommended ARDD sessions.
              </p>
            </div>
            <div className="rounded-lg border border-[#b8cac7] bg-[#f4faf8] px-4 py-3 text-sm text-[#195c52]">
              {selected.length} saved
            </div>
          </header>

          <div className="mt-7 flex w-full max-w-max border-b border-zinc-200">
            {DAYS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDay(item)}
                className={`h-11 px-4 text-sm ${day === item ? 'border-b border-zinc-900 text-black' : 'text-zinc-500 hover:text-black'}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="space-y-3">
              {visibleSessions.map((session) => {
                const isSelected = selected.includes(session.title);
                return (
                  <button
                    key={session.title}
                    type="button"
                    onClick={() => toggleSession(session.title)}
                    className={`w-full rounded-lg border bg-white p-5 text-left transition hover:border-[#4a9b8e] ${
                      isSelected ? 'border-[#4a9b8e] shadow-[0_0_0_1px_#4a9b8e]' : 'border-zinc-200'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#195c52]">{session.time} - {session.room}</p>
                        <h2 className="mt-2 text-xl font-semibold leading-7 text-black">{session.title}</h2>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isSelected ? 'bg-[#195c52] text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                        {isSelected ? 'Saved' : 'Add'}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {session.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </div>
                  </button>
                );
              })}
            </section>

            <aside className="h-max rounded-lg border border-zinc-200 bg-[#f8fbfa] p-5">
              <h2 className="text-base font-semibold text-black">My Agenda</h2>
              <div className="mt-4 space-y-3">
                {selected.length ? (
                  selected.map((title) => <p key={title} className="rounded border border-zinc-200 bg-white p-3 text-sm text-zinc-700">{title}</p>)
                ) : (
                  <p className="text-sm leading-6 text-zinc-500">Select sessions to assemble your agenda.</p>
                )}
              </div>
              <MyButton className="mt-5 w-full" disabled={!selected.length}>
                Export Agenda
              </MyButton>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
