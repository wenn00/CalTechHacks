'use client';

import { useEffect, useState, useCallback } from 'react';

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

interface FilterOptions {
  researchAreas: string[];
  institutions: string[];
  careerStages: string[];
  roles: string[];
}

interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function DirectoryPage() {
  const [attendees, setAttendees]     = useState<Attendee[]>([]);
  const [filters, setFilters]         = useState<FilterOptions>({ researchAreas: [], institutions: [], careerStages: [], roles: [] });
  const [meta, setMeta]               = useState<Meta>({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [selected, setSelected]       = useState<Attendee | null>(null);
  const [loading, setLoading]         = useState(true);

  const [q, setQ]                     = useState('');
  const [researchArea, setResearchArea] = useState('');
  const [careerStage, setCareerStage] = useState('');
  const [institution, setInstitution] = useState('');
  const [page, setPage]               = useState(1);

  // Load filter options once
  useEffect(() => {
    fetch(`${API}/api/attendees/filters`)
      .then(r => r.json())
      .then(({ data }) => setFilters(data))
      .catch(console.error);
  }, []);

  const fetchAttendees = useCallback(async (p = page) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: '12' });
    if (q)            params.set('q', q);
    if (researchArea) params.set('research_area', researchArea);
    if (careerStage)  params.set('career_stage', careerStage);
    if (institution)  params.set('institution', institution);

    try {
      const res  = await fetch(`${API}/api/attendees?${params}`);
      const json = await res.json();
      setAttendees(json.data || []);
      setMeta(json.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [q, researchArea, careerStage, institution, page]);

  useEffect(() => { fetchAttendees(page); }, [page]);

  function search() { setPage(1); fetchAttendees(1); }
  function clear()  { setQ(''); setResearchArea(''); setCareerStage(''); setInstitution(''); setPage(1); }

  function initials(name: string) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  function fmtStage(s: string | null) {
    return (s || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Attendee Directory</h1>
        <p className="text-sm text-gray-500 mt-1">ARDD 2026 Conference</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Search by name, keywords, bio..."
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={researchArea} onChange={e => setResearchArea(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Research Areas</option>
          {filters.researchAreas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={careerStage} onChange={e => setCareerStage(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Career Stages</option>
          {filters.careerStages.map(s => <option key={s} value={s}>{fmtStage(s)}</option>)}
        </select>
        <select value={institution} onChange={e => setInstitution(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Institutions</option>
          {filters.institutions.map(i => <option key={i} value={i}>{i}</option>)}
        </select>
        <button onClick={search}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Search
        </button>
        <button onClick={clear}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
          Clear
        </button>
      </div>

      {/* Count */}
      <div className="px-6 py-2 text-sm text-gray-500">
        {loading ? 'Loading...' : `${meta.total} attendees found`}
      </div>

      {/* Grid */}
      <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {!loading && attendees.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No attendees found</p>
            <p className="text-sm mt-1">Try different search terms or clear filters</p>
          </div>
        )}
        {attendees.map(a => (
          <div key={a.id} onClick={() => setSelected(a)}
            className="bg-white rounded-xl p-4 border border-gray-200 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center gap-3 mb-3">
              {a.photo_url
                ? <img src={a.photo_url} alt={a.name} className="w-12 h-12 rounded-full object-cover" />
                : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-bold text-lg">{initials(a.name)}</div>
              }
              <div>
                <p className="font-semibold text-gray-900 leading-tight">{a.name}</p>
                <p className="text-xs text-gray-500">{fmtStage(a.career_stage)}{a.role ? ` · ${a.role}` : ''}</p>
              </div>
            </div>
            {a.institution && <p className="text-xs text-blue-600 mb-2 truncate">🏛 {a.institution}</p>}
            {a.bio && <p className="text-xs text-gray-600 line-clamp-3 mb-3">{a.bio}</p>}
            <div className="flex flex-wrap gap-1">
              {a.research_area && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{a.research_area}</span>}
              {(a.research_keywords || []).slice(0, 3).map(k => (
                <span key={k} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{k}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-3 pb-8">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
            ← Prev
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">Page {meta.page} of {meta.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
            Next →
          </button>
        </div>
      )}

      {/* Profile modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                {selected.photo_url
                  ? <img src={selected.photo_url} alt={selected.name} className="w-16 h-16 rounded-full object-cover" />
                  : <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-bold text-2xl">{initials(selected.name)}</div>
                }
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                  <p className="text-sm text-gray-500">{fmtStage(selected.career_stage)}{selected.role ? ` · ${selected.role}` : ''}</p>
                  {selected.institution && <p className="text-sm text-blue-600">{selected.institution}</p>}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {selected.bio && <div className="mb-4"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Bio</p><p className="text-sm text-gray-700 leading-relaxed">{selected.bio}</p></div>}
            {selected.research_area && <div className="mb-4"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Research Area</p><p className="text-sm text-gray-700">{selected.research_area}</p></div>}
            {selected.research_keywords?.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Keywords</p>
                <div className="flex flex-wrap gap-1">{selected.research_keywords.map(k => <span key={k} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{k}</span>)}</div>
              </div>
            )}
            {selected.abstract_summary && <div className="mb-4"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Abstract</p><p className="text-sm text-gray-700 leading-relaxed">{selected.abstract_summary}</p></div>}
            {selected.goals?.length > 0 && <div className="mb-4"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Conference Goals</p><p className="text-sm text-gray-700">{selected.goals.join(' · ')}</p></div>}
            {selected.company_name && <div className="mb-4"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Company</p><p className="text-sm text-gray-700">{selected.company_name}</p></div>}
            <div className="flex gap-2 mt-4 flex-wrap">
              {selected.linkedin_url && <a href={selected.linkedin_url} target="_blank" rel="noreferrer" className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-blue-600 hover:bg-blue-50">LinkedIn</a>}
              {selected.google_scholar_url && <a href={selected.google_scholar_url} target="_blank" rel="noreferrer" className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg text-blue-600 hover:bg-blue-50">Google Scholar</a>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
