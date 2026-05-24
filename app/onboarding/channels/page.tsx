'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Channel {
  name: string;
  description: string;
  link: string;
  emoji: string;
}

const ALL_CHANNELS: Record<string, Channel> = {
  fundraising: {
    name: 'ARDD Investors & Fundraising',
    description: 'Connect with longevity VCs, angels, and biotech founders raising capital.',
    link: 'https://wa.me/+1234567890',
    emoji: '💰',
  },
  collaboration: {
    name: 'Scientific Collaboration Network',
    description: 'Find co-authors, lab partners, and cross-institutional research collaborators.',
    link: 'https://slack.com/ardd-collab',
    emoji: '🔬',
  },
  recruiting: {
    name: 'ARDD Talent & Recruiting',
    description: 'Post openings or find roles at top longevity labs and biotechs.',
    link: 'https://wa.me/+1234567891',
    emoji: '🎯',
  },
  publishing: {
    name: 'Longevity Publishing Circle',
    description: 'Share pre-prints, find peer reviewers, and discuss publication strategies.',
    link: 'https://slack.com/ardd-publishing',
    emoji: '📄',
  },
  business_development: {
    name: 'BD & Partnerships Channel',
    description: 'Explore licensing deals, pharma partnerships, and commercialization opportunities.',
    link: 'https://wa.me/+1234567892',
    emoji: '🤝',
  },
  longevity_biology: {
    name: 'Longevity Biology Discussion',
    description: 'Deep dives into senolytics, epigenetic reprogramming, and aging mechanisms.',
    link: 'https://slack.com/longevity-bio',
    emoji: '🧬',
  },
  drug_discovery: {
    name: 'Drug Discovery & Development',
    description: 'From target ID to IND — connect with researchers advancing aging therapeutics.',
    link: 'https://slack.com/ardd-drug-disc',
    emoji: '💊',
  },
  ai_ml: {
    name: 'AI/ML in Aging Research',
    description: 'Machine learning for aging clocks, drug discovery, and biomarker identification.',
    link: 'https://slack.com/ardd-ai',
    emoji: '🤖',
  },
  clinical: {
    name: 'Clinical Trials & Geroscience',
    description: 'Discuss trial design, endpoints, and translating aging biology to the clinic.',
    link: 'https://slack.com/ardd-clinical',
    emoji: '🏥',
  },
  general: {
    name: 'ARDD 2026 General Community',
    description: 'Main hub for all ARDD 2026 attendees — announcements, networking, and more.',
    link: 'https://wa.me/+1234567893',
    emoji: '🌐',
  },
};

function getRecommendedChannels(goals: string[], researchArea: string): Channel[] {
  const keys = new Set<string>(['general']);

  goals.forEach(g => {
    const key = g.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
    if (ALL_CHANNELS[key]) keys.add(key);
  });

  const area = (researchArea || '').toLowerCase();
  if (area.includes('longevity') || area.includes('senolytic') || area.includes('aging')) keys.add('longevity_biology');
  if (area.includes('drug') || area.includes('discovery')) keys.add('drug_discovery');
  if (area.includes('ai') || area.includes('machine learning') || area.includes('biomarker')) keys.add('ai_ml');
  if (area.includes('clinical') || area.includes('trial')) keys.add('clinical');
  if (area.includes('regenerative') || area.includes('stem')) keys.add('longevity_biology');

  return Array.from(keys).map(k => ALL_CHANNELS[k]).filter(Boolean);
}

export default function ChannelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isMock = searchParams.get('mock') === 'true';

  const [channels, setChannels] = useState<Channel[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (isMock) {
        // Show all channels in mock mode
        setChannels(Object.values(ALL_CHANNELS));
        setName('Attendee');
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, goals, research_area')
        .eq('id', user.id)
        .single();

      const metaName =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined);
      const profileFirst = profile?.name?.trim() ? profile.name.split(' ')[0] : null;
      const metaFirst = metaName?.split(' ')[0];
      const emailPrefix = user.email?.split('@')[0];
      setName(profileFirst ?? metaFirst ?? emailPrefix ?? 'there');

      if (profile) {
        setChannels(getRecommendedChannels(profile.goals || [], profile.research_area || ''));
      } else {
        setChannels(Object.values(ALL_CHANNELS));
      }
      setLoading(false);
    }
    load();
  }, [isMock, router]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-500">Loading your channels...</div>;

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {name}! 🎉</h1>
        <p className="text-gray-500 mt-2">Here are your recommended ARDD 2026 communities based on your profile.</p>
      </div>

      <div className="space-y-3 mb-8">
        {channels.map((ch) => (
          <div key={ch.name} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{ch.emoji}</span>
              <div>
                <p className="font-semibold text-gray-900">{ch.name}</p>
                <p className="text-sm text-gray-500">{ch.description}</p>
              </div>
            </div>
            <a
              href={ch.link}
              target="_blank"
              rel="noreferrer"
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 whitespace-nowrap"
            >
              Join
            </a>
          </div>
        ))}
      </div>

      <div className="text-center space-y-3">
        <Link
          href="/directory"
          className="block w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors"
        >
          Explore the Attendee Directory →
        </Link>
        <p className="text-sm text-gray-400">Browse and connect with all ARDD 2026 attendees</p>
      </div>
    </div>
  );
}
