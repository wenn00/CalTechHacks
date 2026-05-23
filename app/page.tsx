import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold">ARDD 2026 Assistant</h1>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Sign In</Link>
          <Link href="/directory" className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-semibold hover:bg-gray-50">Attendee Directory</Link>
        </div>
      </div>
    </main>
  );
}
