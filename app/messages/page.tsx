'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { io, type Socket } from 'socket.io-client';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Peer {
  id: string;
  name: string;
  photo_url: string | null;
  institution: string | null;
  role: string | null;
}

interface Conversation {
  id: string;
  participants: Peer[];
  last_message: { content: string; sender_id: string; created_at: string } | null;
  unread_count: number;
  updated_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: { id: string; name: string; photo_url: string | null } | null;
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MessagesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const targetConvId = params.get('c');

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [convs, setConvs] = useState<Conversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [draft, setDraft] = useState('');
  const [peerTyping, setPeerTyping] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── auth: keep token in sync with Supabase session ──────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setToken(data.session?.access_token ?? null);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setToken(session?.access_token ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ─── REST helper bound to current token ──────────────────────────────────
  const api = useCallback(
    async <T,>(method: string, path: string, body?: unknown): Promise<{ ok: boolean; data: T | null }> => {
      if (!token) return { ok: false, data: null };
      try {
        const res = await fetch(`${API}/api/messages${path}`, {
          method,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        const json = await res.json().catch(() => null);
        return { ok: res.ok, data: (json?.data ?? null) as T | null };
      } catch (error) {
        console.warn('messages api unavailable:', error);
        return { ok: false, data: null };
      }
    },
    [token],
  );

  // ─── load conversation list ──────────────────────────────────────────────
  const loadConvs = useCallback(async () => {
    const { data } = await api<Conversation[]>('GET', '/conversations');
    if (data) setConvs(data);
  }, [api]);

  useEffect(() => { if (token) loadConvs(); }, [token, loadConvs]);

  // If /messages?c=<id> is provided, auto-open it once convs are loaded
  // (or open it directly even if not in the list yet — server will 404 otherwise)
  useEffect(() => {
    if (!token || !targetConvId) return;
    setCurrentId(targetConvId);
  }, [token, targetConvId]);

  // ─── socket connection ───────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const s = io(API, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = s;

    s.on('new_message', (payload: { message: Message; conversationId?: string }) => {
      const m = payload.message;
      // Always refresh sidebar (badge + last_message preview)
      loadConvs();
      // Append to open thread if it matches
      setCurrentId((openId) => {
        if (openId && m.conversation_id === openId) {
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          // we are looking — mark read
          s.emit('mark_read', { conversationId: openId });
          if (token) {
            fetch(`${API}/api/messages/conversations/${openId}/read`, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
          }
        }
        return openId;
      });
    });

    s.on('user_typing', ({ conversationId }: { conversationId: string }) => {
      setCurrentId((openId) => {
        if (openId === conversationId) {
          setPeerTyping(true);
          if (typingTimer.current) clearTimeout(typingTimer.current);
          typingTimer.current = setTimeout(() => setPeerTyping(false), 2000);
        }
        return openId;
      });
    });

    s.on('error', (e: { message: string }) => console.warn('socket error:', e?.message));

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [token, loadConvs]);

  // ─── load messages when current conv changes ─────────────────────────────
  useEffect(() => {
    if (!currentId || !token) {
      setMessages([]);
      return;
    }
    setPeerTyping(false);
    setLoadingMsgs(true);
    api<{ messages: Message[] }>('GET', `/conversations/${currentId}/messages`).then(({ data }) => {
      setMessages(data?.messages ?? []);
      setLoadingMsgs(false);
    });
    socketRef.current?.emit('join_conversation', { conversationId: currentId });
    socketRef.current?.emit('mark_read', { conversationId: currentId });
    api('PUT', `/conversations/${currentId}/read`).then(() => loadConvs());
  }, [currentId, token, api, loadConvs]);

  // auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, currentId]);

  // ─── send ────────────────────────────────────────────────────────────────
  const send = () => {
    const content = draft.trim();
    if (!content || !currentId || !socketRef.current) return;
    socketRef.current.emit('send_message', { conversationId: currentId, content });
    setDraft('');
  };

  const onDraftChange = (v: string) => {
    setDraft(v);
    if (currentId && socketRef.current) {
      socketRef.current.emit('typing', { conversationId: currentId });
    }
  };

  const currentConv = useMemo(
    () => convs.find((c) => c.id === currentId) ?? null,
    [convs, currentId],
  );
  const peer = currentConv?.participants[0] ?? null;

  // ─── render ──────────────────────────────────────────────────────────────
  if (authChecked && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl p-8 max-w-md text-center border border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Sign in required</h1>
          <p className="text-sm text-gray-600 mb-4">You need to sign in to view and send messages.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-57px)] flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          <p className="text-xs text-gray-500">{convs.length} conversation{convs.length === 1 ? '' : 's'}</p>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {convs.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-gray-400">
              No conversations yet.
              <br />
              Open someone&rsquo;s profile in the
              <button
                onClick={() => router.push('/directory')}
                className="text-blue-600 hover:underline mx-1"
              >
                Directory
              </button>
              and click <strong>Send Message</strong>.
            </li>
          )}
          {convs.map((c) => {
            const p = c.participants[0];
            const active = c.id === currentId;
            return (
              <li
                key={c.id}
                onClick={() => setCurrentId(c.id)}
                className={`px-5 py-3 cursor-pointer border-l-4 flex items-center gap-3 ${
                  active
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-transparent hover:bg-gray-50'
                }`}
              >
                {p?.photo_url ? (
                  <img src={p.photo_url} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-sm font-bold">
                    {initials(p?.name ?? '?')}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-semibold text-sm text-gray-900 truncate">{p?.name ?? 'Unknown'}</p>
                    {c.unread_count > 0 && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {c.unread_count}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {c.last_message?.content ?? <em>— no messages yet —</em>}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Thread */}
      <section className="flex-1 flex flex-col">
        {!currentId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            ← Pick a conversation from the sidebar
          </div>
        ) : (
          <>
            <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-3 min-h-[57px]">
              {peer?.photo_url ? (
                <img src={peer.photo_url} alt={peer.name} className="w-9 h-9 rounded-full object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-sm font-bold">
                  {initials(peer?.name ?? '?')}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">{peer?.name ?? 'Conversation'}</p>
                <p className="text-xs text-gray-500 italic h-4">
                  {peerTyping ? 'typing…' : peer?.institution ?? ''}
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-2">
              {loadingMsgs && <p className="text-center text-xs text-gray-400">Loading…</p>}
              {!loadingMsgs && messages.length === 0 && (
                <p className="text-center text-xs text-gray-400">Say hi 👋</p>
              )}
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm leading-snug break-words ${
                      mine
                        ? 'self-end bg-blue-600 text-white ml-auto'
                        : 'self-start bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    <div>{m.content}</div>
                    <div className={`text-[10px] mt-0.5 ${mine ? 'text-blue-100' : 'text-gray-400'}`}>
                      {fmtTime(m.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 bg-white border-t border-gray-200 flex gap-2">
              <input
                value={draft}
                onChange={(e) => onDraftChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                maxLength={5000}
                placeholder="Type a message… (Enter to send)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={send}
                disabled={!draft.trim()}
                className="px-5 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading…</div>}>
      <MessagesInner />
    </Suspense>
  );
}
