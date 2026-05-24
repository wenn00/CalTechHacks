'use client';

import { useMemo, useState } from 'react';
import { AppSidebar, Field, MyButton, Tag } from '@/components/mycellium/ui';

type Video = {
  id: string;
  title: string;
  speaker: string;
  organization: string;
  tags: string[];
};

type Comment = {
  name: string;
  text: string;
  time: string;
};

const VIDEOS: Video[] = [
  {
    id: 'GB2G1R7ATJw',
    title: 'AI for rejuvenation and replacement therapies',
    speaker: 'Joe Betts-LaCroix',
    organization: 'Retro Biosciences',
    tags: ['AI', 'Rejuvenation'],
  },
  {
    id: '2w-vcI-nYwc',
    title: 'Repurposed drugs for longevity',
    speaker: 'Nir Barzilai',
    organization: 'Albert Einstein College of Medicine',
    tags: ['Clinical', 'Repurposing'],
  },
  {
    id: 'MHIyEBApmqA',
    title: 'Young Human Longevity Medical Study',
    speaker: 'Andrea Olsen',
    organization: 'Caltech',
    tags: ['Clinical', 'Biomarkers'],
  },
  {
    id: '2D2CD0gnAYM',
    title: 'Epigenetic clocks working group',
    speaker: 'Andrea Maier',
    organization: 'National University of Singapore',
    tags: ['Epigenetics', 'Working Group'],
  },
  {
    id: 'S_iificYy5o',
    title: 'Senolytics',
    speaker: 'James Kirkland',
    organization: 'Kogod Center on Aging',
    tags: ['Senolytics', 'Therapeutics'],
  },
];

const REACTIONS = ['Like', 'Applause'] as const;

export default function VideosPage() {
  const [search, setSearch] = useState('');
  const [currentId, setCurrentId] = useState(VIDEOS[0].id);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [reactions, setReactions] = useState<Record<string, Record<(typeof REACTIONS)[number], boolean>>>({});

  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return VIDEOS;
    return VIDEOS.filter((video) =>
      [video.title, video.speaker, video.organization, ...video.tags].some((value) => value.toLowerCase().includes(query)),
    );
  }, [search]);

  const currentVideo = VIDEOS.find((video) => video.id === currentId) ?? VIDEOS[0];
  const currentComments = comments[currentVideo.id] ?? [];
  const currentReactions = reactions[currentVideo.id] ?? {};

  const postComment = () => {
    const text = commentText.trim();
    if (!text) return;

    const name = commentName.trim() || 'Anonymous';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setComments((current) => ({
      ...current,
      [currentVideo.id]: [{ name, text, time }, ...(current[currentVideo.id] ?? [])],
    }));
    setCommentText('');
  };

  const toggleReaction = (reaction: (typeof REACTIONS)[number]) => {
    setReactions((current) => ({
      ...current,
      [currentVideo.id]: {
        ...(current[currentVideo.id] ?? {}),
        [reaction]: !current[currentVideo.id]?.[reaction],
      },
    }));
  };

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="md:flex">
        <AppSidebar activeSection="videos" />

        <section className="min-h-screen flex-1 px-5 py-6 lg:px-8">
          <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold leading-tight">Video Library</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                Watch prior ARDD talks and keep lightweight notes for follow-up.
              </p>
            </div>
            <div className="rounded-lg border border-[#b8cac7] bg-[#f4faf8] px-4 py-3 text-sm text-[#195c52]">
              {VIDEOS.length} talks
            </div>
          </header>

          <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="h-max min-w-0 rounded-lg border border-zinc-200 bg-[#f8fbfa] p-4">
              <Field
                aria-label="Search talks"
                placeholder="Search talks..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <div className="mt-4 max-h-[680px] space-y-3 overflow-auto pr-1">
                {filteredVideos.map((video) => {
                  const active = video.id === currentVideo.id;
                  return (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => setCurrentId(video.id)}
                      className={`flex w-full gap-3 rounded-lg border bg-white p-3 text-left transition hover:border-[#4a9b8e] ${
                        active ? 'border-[#4a9b8e] shadow-[0_0_0_1px_#4a9b8e]' : 'border-zinc-200'
                      }`}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                        alt=""
                        className="h-16 w-24 shrink-0 rounded bg-zinc-100 object-cover"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-5 text-black">{video.title}</span>
                        <span className="mt-1 block truncate text-xs text-zinc-500">
                          {video.speaker} · {video.organization}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {!filteredVideos.length && <p className="px-1 py-6 text-sm text-zinc-500">No talks match this search.</p>}
              </div>
            </aside>

            <section className="min-w-0 overflow-hidden rounded-lg border border-zinc-200 bg-white">
              <div className="aspect-video bg-black">
                <iframe
                  key={currentVideo.id}
                  title={currentVideo.title}
                  src={`https://www.youtube.com/embed/${currentVideo.id}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>

              <div className="p-5 lg:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold leading-tight text-black">{currentVideo.title}</h2>
                    <p className="mt-2 text-sm text-zinc-500">
                      {currentVideo.speaker} · {currentVideo.organization}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentVideo.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-zinc-200 pt-5">
                  <h3 className="text-sm font-semibold text-black">React to this talk</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {REACTIONS.map((reaction) => (
                      <button
                        key={reaction}
                        type="button"
                        onClick={() => toggleReaction(reaction)}
                        className={`rounded border px-3 py-2 text-sm font-semibold transition ${
                          currentReactions[reaction]
                            ? 'border-[#195c52] bg-[#ddf2ef] text-[#195c52]'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-[#4a9b8e]'
                        }`}
                      >
                        {reaction}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-zinc-200 pt-5">
                  <h3 className="text-sm font-semibold text-black">Comments</h3>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_96px]">
                    <Field aria-label="Your name" placeholder="Your name" value={commentName} onChange={(event) => setCommentName(event.target.value)} />
                    <Field
                      aria-label="Comment"
                      placeholder="Add a comment or note..."
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') postComment();
                      }}
                    />
                    <MyButton className="w-full px-4" disabled={!commentText.trim()} onClick={postComment}>
                      Post
                    </MyButton>
                  </div>

                  <div className="mt-4 space-y-3">
                    {currentComments.length ? (
                      currentComments.map((comment, index) => (
                        <div key={`${comment.time}-${index}`} className="rounded border border-zinc-200 bg-[#f8fbfa] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-black">{comment.name}</p>
                            <p className="text-xs text-zinc-500">{comment.time}</p>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-zinc-700">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500">No comments yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
