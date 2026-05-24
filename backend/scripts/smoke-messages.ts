/**
 * Smoke test for the /api/messages REST API and Socket.IO realtime layer.
 *
 * Drives both surfaces end-to-end against a running backend (default
 * http://localhost:3001) and prints a green/red checklist. Designed to be
 * safe to re-run: reuses two fixed test identities and deletes every
 * conversation it creates before exiting.
 *
 * Exit codes:
 *   0 — all checks passed
 *   1 — at least one check failed
 *   2 — setup error (missing env, backend down, signup blocked, ...)
 *
 * Requirements:
 *   - Backend dev server running on $SMOKE_BACKEND_URL (default localhost:3001)
 *   - DATABASE_URL set (taken from backend/.env automatically)
 *   - SUPABASE_URL + SUPABASE_ANON_KEY in env. Falls back to
 *     NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in the
 *     project root's .env.local, so no extra setup is needed.
 *   - FIRST RUN ONLY: Supabase email confirm must be OFF
 *     (Dashboard → Authentication → Sign In/Up). After the two smoke users
 *     exist in auth.users you can turn it back on — subsequent runs just
 *     sign in.
 */

import "dotenv/config";
import { config as loadEnv } from "dotenv";
import path from "path";
import { randomUUID } from "crypto";
import { PrismaClient } from "@prisma/client";
import { io as connect, type Socket } from "socket.io-client";

// Fall back to the Next.js .env.local at the project root for the anon key.
loadEnv({ path: path.resolve(__dirname, "../../.env.local") });

const BACKEND_URL = process.env.SMOKE_BACKEND_URL ?? "http://localhost:3001";
const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? must("SUPABASE_URL");
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  must("SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");

function must(name: string): never {
  console.error(`✗ missing env: ${name}`);
  process.exit(2);
}

const PEERS = [
  { email: "smoke-mycel-a@example.com", password: "Smoke!Mycel2026", name: "Smoke A" },
  { email: "smoke-mycel-b@example.com", password: "Smoke!Mycel2026", name: "Smoke B" },
] as const;

const prisma = new PrismaClient();

// ─── result tracking ──────────────────────────────────────────────────────────

interface Result { name: string; passed: boolean; detail?: string }
const results: Result[] = [];
const GREEN = "\x1b[32m", RED = "\x1b[31m", DIM = "\x1b[2m", RESET = "\x1b[0m";

function check(name: string, passed: boolean, detail?: string) {
  results.push({ name, passed, detail });
  const icon = passed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
  const tail = detail ? `${DIM} — ${detail}${RESET}` : "";
  console.log(`  ${icon} ${name}${tail}`);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

async function api(
  token: string | null,
  method: string,
  pathSuffix: string,
  body?: unknown,
): Promise<{ status: number; json: any }> {
  const r = await fetch(`${BACKEND_URL}/api/messages${pathSuffix}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json: any = null;
  try { json = await r.json(); } catch { /* empty body */ }
  return { status: r.status, json };
}

// ─── Supabase auth ────────────────────────────────────────────────────────────

interface AuthUser { access_token: string; user: { id: string } }

async function supabaseSignIn(email: string, password: string): Promise<AuthUser | null> {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) return null;
  return (await r.json()) as AuthUser;
}

async function supabaseSignUp(email: string, password: string): Promise<AuthUser> {
  const r = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(
      `Supabase signup failed (HTTP ${r.status}): ${body}\n` +
      `→ If this mentions "confirmation email", turn email confirm OFF in the\n` +
      `  Supabase Dashboard for the first run, then turn it back on.`,
    );
  }
  return (await r.json()) as AuthUser;
}

async function getOrCreateAuthUser(email: string, password: string): Promise<AuthUser> {
  const existing = await supabaseSignIn(email, password);
  if (existing) return existing;
  return await supabaseSignUp(email, password);
}

// ─── socket helper ────────────────────────────────────────────────────────────

function makeSocket(token: string): Socket {
  return connect(BACKEND_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: false,
  });
}

// ─── the suite ────────────────────────────────────────────────────────────────

async function main() {
  // Setup ────────────────────────────────────────────────────────────────────
  console.log(`\n${DIM}backend: ${BACKEND_URL}${RESET}`);
  console.log("\n→ setup");

  const [A, B] = await Promise.all([
    getOrCreateAuthUser(PEERS[0].email, PEERS[0].password),
    getOrCreateAuthUser(PEERS[1].email, PEERS[1].password),
  ]);
  console.log(`  ${PEERS[0].email} → ${A.user.id.slice(0, 8)}…`);
  console.log(`  ${PEERS[1].email} → ${B.user.id.slice(0, 8)}…`);

  // Profiles must mirror the auth user UUIDs. Upsert so re-runs are no-ops.
  await Promise.all([
    prisma.profiles.upsert({
      where: { email: PEERS[0].email },
      update: {},
      create: { id: A.user.id, name: PEERS[0].name, email: PEERS[0].email, onboarding_complete: true },
    }),
    prisma.profiles.upsert({
      where: { email: PEERS[1].email },
      update: {},
      create: { id: B.user.id, name: PEERS[1].name, email: PEERS[1].email, onboarding_complete: true },
    }),
  ]);

  const convsToClean: string[] = [];

  try {
    // L1 — health ───────────────────────────────────────────────────────────
    console.log("\n→ L1 health");
    {
      const r = await fetch(`${BACKEND_URL}/health`).then((x) => x.json()).catch(() => null);
      check("GET /health returns status:ok", r?.status === "ok");
      const ping = await api(null, "GET", "/ping");
      check(
        "GET /api/messages/ping returns live",
        ping.status === 200 && /live/i.test(ping.json?.message ?? ""),
      );
    }

    // L2 — auth gating ──────────────────────────────────────────────────────
    console.log("\n→ L2 auth gating");
    {
      const r1 = await api(null, "GET", "/conversations");
      check("no token → 401", r1.status === 401);
      const r2 = await api("not-a-jwt", "GET", "/conversations");
      check("garbage token → 401", r2.status === 401);
    }

    // L3 — happy path (REST) ────────────────────────────────────────────────
    console.log("\n→ L3 REST happy path (A ↔ B)");
    let convId = "";
    {
      const r1 = await api(A.access_token, "POST", "/conversations", { participantId: B.user.id });
      convId = r1.json?.data?.id;
      if (convId) convsToClean.push(convId);
      check("POST /conversations → 201 with id", r1.status === 201 && !!convId);

      const r2 = await api(A.access_token, "POST", "/conversations", { participantId: B.user.id });
      check("POST /conversations idempotent (same pair → same id)", r2.json?.data?.id === convId);

      const r3 = await api(A.access_token, "POST", `/conversations/${convId}/messages`, {
        content: "smoke hello",
      });
      check(
        "POST message → 201 with sender attached",
        r3.status === 201 &&
          r3.json?.data?.content === "smoke hello" &&
          r3.json?.data?.sender?.id === A.user.id,
      );

      const r4 = await api(A.access_token, "GET", "/conversations");
      const ours = (r4.json?.data ?? []).find((c: any) => c.id === convId);
      check(
        "GET /conversations lists our conv with last_message",
        !!ours && ours.last_message?.content === "smoke hello",
      );

      const r5 = await api(A.access_token, "GET", `/conversations/${convId}`);
      check(
        "GET /conversations/:id returns the other participant",
        r5.status === 200 && r5.json?.data?.participants?.[0]?.id === B.user.id,
      );

      const r6 = await api(A.access_token, "GET", `/conversations/${convId}/messages`);
      const msgs = r6.json?.data?.messages ?? [];
      check("GET messages includes our message", msgs.some((m: any) => m.content === "smoke hello"));

      const r7 = await api(A.access_token, "PUT", `/conversations/${convId}/read`);
      check("PUT /read → marked:true", r7.json?.data?.marked === true);

      // After A reads, B's unread should be 1 (B never read A's message).
      const r8 = await api(B.access_token, "GET", "/conversations");
      const fromB = (r8.json?.data ?? []).find((c: any) => c.id === convId);
      check("unread_count from B's POV is 1", fromB?.unread_count === 1, `got ${fromB?.unread_count}`);
    }

    // L4 — validation (Bug B regression) ────────────────────────────────────
    console.log("\n→ L4 validation");
    {
      const r1 = await api(A.access_token, "POST", `/conversations/${convId}/messages`, { content: "" });
      check("empty content → 400", r1.status === 400);

      const r2 = await api(A.access_token, "POST", `/conversations/${convId}/messages`, { content: "   " });
      check("whitespace-only → 400  [Bug B regression]", r2.status === 400);

      const r3 = await api(A.access_token, "POST", `/conversations/${convId}/messages`, {
        content: "  trim me  ",
      });
      check(
        "padded content is trimmed before save",
        r3.status === 201 && r3.json?.data?.content === "trim me",
      );

      const r4 = await api(A.access_token, "POST", `/conversations/${convId}/messages`, {
        content: "x".repeat(5001),
      });
      check("5001 chars → 400", r4.status === 400);

      const r5 = await api(A.access_token, "POST", "/conversations", { participantId: A.user.id });
      check("message yourself → rejected", r5.json?.success === false);

      const r6 = await api(A.access_token, "POST", "/conversations", { participantId: "not-a-uuid" });
      check("invalid uuid → 400", r6.status === 400);
    }

    // L5 — security (Bug A regression) ──────────────────────────────────────
    console.log("\n→ L5 security  [Bug A regression]");
    let outsiderId = "";
    {
      // Create a conv between two random UUIDs A is NOT in.
      // (conversation_participants.profile_id has no FK, so any UUID works.)
      const outsider = await prisma.conversations.create({
        data: {
          participants: { create: [{ profile_id: randomUUID() }, { profile_id: randomUUID() }] },
        },
      });
      outsiderId = outsider.id;
      convsToClean.push(outsiderId);

      const r1 = await api(A.access_token, "GET", `/conversations/${outsiderId}`);
      check("GET outsider conv → 404", r1.status === 404);

      const r2 = await api(A.access_token, "GET", `/conversations/${outsiderId}/messages`);
      check("GET outsider messages → 404", r2.status === 404);

      const r3 = await api(A.access_token, "POST", `/conversations/${outsiderId}/messages`, {
        content: "sneaky",
      });
      check("POST to outsider conv → 404", r3.status === 404);

      const count = await prisma.messages.count({ where: { conversation_id: outsiderId } });
      check("DB: no message persisted in outsider conv", count === 0);
    }

    // L6 — socket auth ──────────────────────────────────────────────────────
    console.log("\n→ L6 socket auth");
    {
      const bad = connect(BACKEND_URL, { auth: {}, transports: ["websocket"], reconnection: false });
      const err = await new Promise<string>((resolve) => {
        bad.once("connect_error", (e) => resolve(e.message));
        bad.once("connect", () => resolve(""));
        setTimeout(() => resolve("TIMEOUT"), 3000);
      });
      bad.disconnect();
      check("no-token socket → connect_error mentions token", /token/i.test(err));
    }

    // L7 — socket realtime + dedupe (Bug C regression) ──────────────────────
    console.log("\n→ L7 socket realtime  [Bug C regression]");
    {
      const sa = makeSocket(A.access_token);
      const sb = makeSocket(B.access_token);
      const aMsgs: any[] = [];
      const bMsgs: any[] = [];
      sa.on("new_message", (p) => aMsgs.push(p));
      sb.on("new_message", (p) => bMsgs.push(p));

      await Promise.all([
        new Promise<void>((r) => sa.once("connect", () => r())),
        new Promise<void>((r) => sb.once("connect", () => r())),
      ]);
      check("both sockets connect with valid token", true);

      sa.emit("join_conversation", { conversationId: convId });
      sb.emit("join_conversation", { conversationId: convId });
      // join_conversation is async (DB membership lookup); give it time.
      await sleep(2500);

      sa.emit("send_message", { conversationId: convId, content: "realtime hi" });
      await sleep(3000);

      const aOnce = aMsgs.filter((m) => m.message?.content === "realtime hi").length;
      const bOnce = bMsgs.filter((m) => m.message?.content === "realtime hi").length;
      check("sender (A) receives new_message exactly once", aOnce === 1, `got ${aOnce}`);
      check("peer (B, in conv room) receives exactly once — no dupe", bOnce === 1, `got ${bOnce}`);

      // B leaves the conv room — A sends again — B should still get the
      // message via the personal user room (unread badge fallback).
      sb.disconnect();
      const sb2 = makeSocket(B.access_token);
      const sb2Msgs: any[] = [];
      sb2.on("new_message", (p) => sb2Msgs.push(p));
      await new Promise<void>((r) => sb2.once("connect", () => r()));
      await sleep(500);

      sa.emit("send_message", { conversationId: convId, content: "after leave" });
      await sleep(3000);
      const afterLeave = sb2Msgs.filter((m) => m.message?.content === "after leave").length;
      check(
        "peer (B, out of conv room) gets message via personal room",
        afterLeave === 1,
        `got ${afterLeave}`,
      );

      // Membership rejection on the socket side.
      const errs: string[] = [];
      sa.on("error", (e: any) => errs.push(e?.message ?? ""));
      sa.emit("send_message", { conversationId: outsiderId, content: "should reject" });
      await sleep(2500);
      check(
        "socket send_message to non-member conv → error event",
        errs.some((e) => /participant/i.test(e)),
      );

      // No message should have been persisted to outsider conv.
      const stillEmpty = await prisma.messages.count({ where: { conversation_id: outsiderId } });
      check("DB: socket rejection did not persist to outsider conv", stillEmpty === 0);

      sa.disconnect();
      sb2.disconnect();
    }
  } finally {
    // Cleanup ─────────────────────────────────────────────────────────────
    // Delete every conv we touched — messages and participants cascade.
    // Keep the auth users and their profiles so repeat runs reuse them.
    console.log("\n→ cleanup");
    for (const id of convsToClean) {
      try {
        await prisma.conversations.delete({ where: { id } });
        console.log(`  ${DIM}deleted conv ${id}${RESET}`);
      } catch {
        // ignore — may not exist if a prior step bailed
      }
    }
    await prisma.$disconnect();
  }

  // Report ───────────────────────────────────────────────────────────────────
  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  const allGreen = passed === total;
  console.log("\n" + "═".repeat(60));
  console.log(
    `  ${allGreen ? GREEN + "✓" : RED + "✗"} ${passed}/${total} checks passed${RESET}`,
  );
  if (!allGreen) {
    console.log(`\n  ${RED}Failures:${RESET}`);
    for (const r of results.filter((x) => !x.passed)) {
      console.log(`    - ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
    }
  }
  console.log("═".repeat(60) + "\n");
  process.exit(allGreen ? 0 : 1);
}

main().catch(async (err) => {
  console.error(`\n${RED}✗ smoke test crashed:${RESET}`, err?.message ?? err);
  await prisma.$disconnect().catch(() => {});
  process.exit(2);
});
