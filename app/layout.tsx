import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ARDD 2026",
  description: "Personalized conference navigator for ARDD 2026",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
          <Link href="/" className="font-bold text-gray-900 text-lg">🧬 ARDD 2026</Link>
          <Link href="/directory" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Attendee Directory</Link>
          <Link href="/onboarding" className="text-sm text-gray-600 hover:text-gray-900 font-medium">Onboarding</Link>
          <div className="ml-auto">
            <Link href="/login" className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Sign In</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
