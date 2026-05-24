'use client';

import { useState } from 'react';
import { AppSidebar, Tag } from '@/components/mycellium/ui';

const FLOORS = ['Floor 2', 'Floor 3'] as const;

const FLOOR_PLAN_SRC: Record<(typeof FLOORS)[number], string> = {
  'Floor 2': '/mycellium/floorplan2.png',
  'Floor 3': '/mycellium/floorplan3.png',
};

const ROOMS = [
  { floor: 'Floor 2', name: "Lane's Edge 205", type: 'Session Room', x: '24%', y: '20%' },
  { floor: 'Floor 2', name: 'Riverbend 201', type: 'Session Room', x: '49%', y: '20%' },
  { floor: 'Floor 2', name: 'The Nest 204', type: 'Session Room', x: '66%', y: '22%' },
  { floor: 'Floor 2', name: 'West Hollow 209', type: 'Session Room', x: '25%', y: '43%' },
  { floor: 'Floor 2', name: 'Cedar Grove 220', type: 'Session Room', x: '74%', y: '74%' },
  { floor: 'Floor 2', name: 'Branch View 221', type: 'Session Room', x: '23%', y: '85%' },
  { floor: 'Floor 2', name: 'Nursing Room', type: 'Facility', x: '31%', y: '64%' },
  { floor: 'Floor 3', name: 'Canopy A', type: 'Session Room', x: '31%', y: '28%' },
  { floor: 'Floor 3', name: 'Canopy B', type: 'Session Room', x: '53%', y: '28%' },
  { floor: 'Floor 3', name: 'East Branch', type: 'Session Room', x: '75%', y: '76%' },
  { floor: 'Floor 3', name: 'West Branch', type: 'Session Room', x: '25%', y: '84%' },
  { floor: 'Floor 3', name: 'Atrium', type: 'Common Area', x: '35%', y: '84%' },
];

export default function MapPage() {
  const [floor, setFloor] = useState<(typeof FLOORS)[number]>('Floor 2');
  const visibleRooms = ROOMS.filter((room) => room.floor === floor);

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="md:flex">
        <AppSidebar activeSection="map" />

        <section className="min-h-screen flex-1 px-5 py-6 lg:px-8">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold leading-tight">Map</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Find rooms, networking areas, and conference facilities.
              </p>
            </div>
            <div className="flex w-max border-b border-zinc-200">
              {FLOORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFloor(item)}
                  className={`h-11 px-4 text-sm ${floor === item ? 'border-b border-zinc-900 text-black' : 'text-zinc-500 hover:text-black'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </header>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-h-[560px] overflow-auto rounded-lg border border-zinc-200 bg-[#f8fbfa] p-4">
              <div className="relative mx-auto w-full min-w-[760px] max-w-[1080px]">
                <img
                  src={FLOOR_PLAN_SRC[floor]}
                  alt={`${floor} venue floor plan`}
                  className="block h-auto w-full rounded bg-white shadow-sm"
                />
                {visibleRooms.map((room) => (
                  <button
                    key={room.name}
                    type="button"
                    className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border bg-white/95 px-3 py-2 text-left text-xs font-semibold shadow-sm transition hover:scale-105 ${
                      room.type === 'Facility'
                        ? 'border-[#f59e0b] text-[#8a5a00]'
                        : room.type === 'Common Area'
                          ? 'border-[#4a9b8e] text-[#195c52]'
                          : 'border-[#195c52] text-[#0b2e28]'
                    }`}
                    style={{ left: room.x, top: room.y }}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        room.type === 'Facility' ? 'bg-[#f59e0b]' : room.type === 'Common Area' ? 'bg-[#4a9b8e]' : 'bg-[#195c52]'
                      }`}
                    />
                    <span>{room.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <aside className="h-max rounded-lg border border-zinc-200 bg-white p-5">
              <h2 className="text-base font-semibold text-black">{floor} Rooms</h2>
              <div className="mt-4 space-y-3">
                {visibleRooms.map((room) => (
                  <div key={room.name} className="rounded border border-zinc-200 p-3">
                    <p className="font-semibold text-black">{room.name}</p>
                    <div className="mt-2">
                      <Tag>{room.type}</Tag>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
