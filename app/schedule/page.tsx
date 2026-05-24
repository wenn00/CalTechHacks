'use client';

import { useState } from 'react';
import { AppSidebar, MyButton, Tag } from '@/components/mycellium/ui';

const DAYS = ['Day 1', 'Day 2', 'Day 3'] as const;
const DAY_DATE_KEYS: Record<(typeof DAYS)[number], string> = {
  'Day 1': '2026-09-01',
  'Day 2': '2026-09-02',
  'Day 3': '2026-09-03',
};
const CONFERENCE_TIMEZONE_LABEL = 'America/Los_Angeles';
const CONFERENCE_UTC_OFFSET_MINUTES = -7 * 60;
const SESSION_DURATION_MINUTES = 60;

type Session = {
  day: (typeof DAYS)[number];
  time: string;
  title: string;
  room: string;
  tags: string[];
};

const SESSIONS: Session[] = [
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

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatUtcForIcs(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate()),
    'T',
    pad(date.getUTCHours()),
    pad(date.getUTCMinutes()),
    pad(date.getUTCSeconds()),
    'Z',
  ].join('');
}

function conferenceTimeToUtc(day: (typeof DAYS)[number], time: string, addMinutes = 0) {
  const [year, month, date] = DAY_DATE_KEYS[day].split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const utcMs = Date.UTC(year, month - 1, date, hour, minute) - CONFERENCE_UTC_OFFSET_MINUTES * 60_000;
  return new Date(utcMs + addMinutes * 60_000);
}

function buildAgendaIcs(sessions: Session[]) {
  const now = formatUtcForIcs(new Date());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mycellium ARDD 2026//Agenda Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Mycellium ARDD 2026 Agenda',
    `X-WR-TIMEZONE:${CONFERENCE_TIMEZONE_LABEL}`,
  ];

  sessions.forEach((session, index) => {
    const start = conferenceTimeToUtc(session.day, session.time);
    const end = conferenceTimeToUtc(session.day, session.time, SESSION_DURATION_MINUTES);
    const slug = session.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    lines.push(
      'BEGIN:VEVENT',
      `UID:mycellium-${session.day.replace(/\s+/g, '').toLowerCase()}-${slug || index}@ardd2026`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatUtcForIcs(start)}`,
      `DTEND:${formatUtcForIcs(end)}`,
      `SUMMARY:${escapeIcsText(session.title)}`,
      `DESCRIPTION:${escapeIcsText(`ARDD 2026 session. Tags: ${session.tags.join(', ')}`)}`,
      `LOCATION:${escapeIcsText(session.room)}`,
      'END:VEVENT',
    );
  });

  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

function buildGoogleCalendarUrl(session: Session) {
  const start = conferenceTimeToUtc(session.day, session.time);
  const end = conferenceTimeToUtc(session.day, session.time, SESSION_DURATION_MINUTES);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: session.title,
    dates: `${formatUtcForIcs(start)}/${formatUtcForIcs(end)}`,
    details: `ARDD 2026 session. Tags: ${session.tags.join(', ')}`,
    location: session.room,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function SchedulePage() {
  const [day, setDay] = useState<(typeof DAYS)[number]>('Day 1');
  const [selected, setSelected] = useState<string[]>([]);
  const visibleSessions = SESSIONS.filter((session) => session.day === day);
  const selectedSessions = SESSIONS.filter((session) => selected.includes(session.title));

  const toggleSession = (title: string) => {
    setSelected((current) => (current.includes(title) ? current.filter((item) => item !== title) : [...current, title]));
  };

  const exportAgenda = () => {
    if (!selectedSessions.length) return;

    const ics = buildAgendaIcs(selectedSessions);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mycellium-ardd-2026-agenda.ics';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const addToGoogleCalendar = () => {
    if (!selectedSessions.length) return;

    selectedSessions.forEach((session, index) => {
      window.open(buildGoogleCalendarUrl(session), `mycellium-google-calendar-${index}`, 'noopener,noreferrer');
    });
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
                {selectedSessions.length ? (
                  selectedSessions.map((session) => (
                    <p key={session.title} className="rounded border border-zinc-200 bg-white p-3 text-sm text-zinc-700">
                      <span className="block font-semibold text-black">{session.title}</span>
                      <span className="mt-1 block text-xs text-zinc-500">
                        {session.day} · {session.time} · {session.room}
                      </span>
                    </p>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-zinc-500">Select sessions to assemble your agenda.</p>
                )}
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <MyButton className="w-full px-3 text-sm" disabled={!selectedSessions.length} onClick={exportAgenda}>
                  Export Agenda
                </MyButton>
                <MyButton className="w-full px-3 text-sm" variant="secondary" disabled={!selectedSessions.length} onClick={addToGoogleCalendar}>
                  Google Calendar
                </MyButton>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
