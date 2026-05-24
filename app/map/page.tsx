'use client';

import { useState } from 'react';
import { AppSidebar, Tag } from '@/components/mycellium/ui';

const FLOORS = ['Floor 2', 'Floor 3'] as const;

const ROOMS = [
  { floor: 'Floor 2', name: 'Main Hall', type: 'Keynotes', x: '18%', y: '22%', w: '48%', h: '34%' },
  { floor: 'Floor 2', name: 'Room 204', type: 'Breakouts', x: '70%', y: '18%', w: '22%', h: '28%' },
  { floor: 'Floor 2', name: 'Networking Lounge', type: 'Meetups', x: '25%', y: '64%', w: '38%', h: '24%' },
  { floor: 'Floor 3', name: 'Room 302', type: 'Panels', x: '14%', y: '18%', w: '34%', h: '30%' },
  { floor: 'Floor 3', name: 'Room 310', type: 'Workshops', x: '55%', y: '18%', w: '32%', h: '30%' },
  { floor: 'Floor 3', name: 'Poster Area', type: 'Posters', x: '20%', y: '60%', w: '62%', h: '26%' },
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
            <section className="relative min-h-[560px] overflow-hidden rounded-lg border border-zinc-200 bg-[#f8fbfa]">
              <div className="absolute inset-8 rounded-lg border-2 border-[#b8cac7] bg-white">
                <div className="absolute left-[48%] top-0 h-full w-px bg-zinc-200" />
                <div className="absolute left-0 top-[55%] h-px w-full bg-zinc-200" />
                <div className="absolute bottom-5 right-5 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-500">
                  Elevator
                </div>
                <div className="absolute bottom-5 left-5 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-500">
                  Restrooms
                </div>
                {visibleRooms.map((room) => (
                  <button
                    key={room.name}
                    type="button"
                    className="absolute rounded-lg border border-[#4a9b8e] bg-[#deefec] p-4 text-left text-[#195c52] shadow-sm transition hover:scale-[1.02]"
                    style={{ left: room.x, top: room.y, width: room.w, height: room.h }}
                  >
                    <span className="block text-base font-semibold">{room.name}</span>
                    <span className="mt-1 block text-xs">{room.type}</span>
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
