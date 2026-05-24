import { prisma } from "../lib/prisma";

// ─── Conversations ────────────────────────────────────────────────────────────

// Find existing DM between two users, or create one.
// Idempotent — calling twice with the same pair returns the same conversation.
export async function getOrCreateConversation(myId: string, participantId: string) {
  // Find a conversation where BOTH users are participants
  const existing = await prisma.$queryRaw<{ id: string }[]>`
    SELECT c.id FROM conversations c
    JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.profile_id = ${myId}::uuid
    JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.profile_id = ${participantId}::uuid
    LIMIT 1
  `;

  if (existing.length > 0) {
    return getConversationById(existing[0].id, myId);
  }

  const conversation = await prisma.conversations.create({
    data: {
      participants: {
        create: [
          { profile_id: myId },
          { profile_id: participantId },
        ],
      },
    },
  });

  return getConversationById(conversation.id, myId);
}

// List all conversations for a user, with last message + unread count
export async function listConversations(myId: string) {
  const participations = await prisma.conversation_participants.findMany({
    where: { profile_id: myId },
    include: {
      conversation: {
        include: {
          participants: true,
          messages: {
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { conversation: { updated_at: "desc" } },
  });

  // Fetch profile info for all other participants in one query
  const otherIds = participations.flatMap((p) =>
    p.conversation.participants
      .filter((cp) => cp.profile_id !== myId)
      .map((cp) => cp.profile_id)
  );

  const profiles = otherIds.length
    ? await prisma.profiles.findMany({
        where: { id: { in: otherIds } },
        select: { id: true, name: true, photo_url: true, institution: true, role: true },
      })
    : [];

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  return participations.map((p) => {
    const lastReadAt  = p.last_read_at;
    const lastMessage = p.conversation.messages[0] ?? null;
    const otherParticipants = p.conversation.participants
      .filter((cp) => cp.profile_id !== myId)
      .map((cp) => profileMap.get(cp.profile_id) ?? { id: cp.profile_id, name: "Unknown", photo_url: null, institution: null, role: null });

    return {
      id:                p.conversation_id,
      participants:      otherParticipants,
      last_message:      lastMessage ? { content: lastMessage.content, sender_id: lastMessage.sender_id, created_at: lastMessage.created_at } : null,
      unread_count:      0, // computed below
      updated_at:        p.conversation.updated_at,
      _lastReadAt:       lastReadAt,
      _conversationId:   p.conversation_id,
    };
  });
}

// Attach unread counts (separate query to keep listConversations fast)
export async function withUnreadCounts(
  conversations: Awaited<ReturnType<typeof listConversations>>,
  myId: string
) {
  return Promise.all(
    conversations.map(async (conv) => {
      const unread = await prisma.messages.count({
        where: {
          conversation_id: conv._conversationId,
          sender_id: { not: myId },
          created_at: conv._lastReadAt ? { gt: conv._lastReadAt } : undefined,
        },
      });
      const { _lastReadAt, _conversationId, ...rest } = conv;
      return { ...rest, unread_count: unread };
    })
  );
}

export async function getConversationById(conversationId: string, myId: string) {
  const conv = await prisma.conversations.findUnique({
    where: { id: conversationId },
    include: { participants: true },
  });
  if (!conv) return null;

  // Verify requester is a participant
  const isMember = conv.participants.some((p) => p.profile_id === myId);
  if (!isMember) return null;

  const otherIds = conv.participants.filter((p) => p.profile_id !== myId).map((p) => p.profile_id);
  const profiles = await prisma.profiles.findMany({
    where: { id: { in: otherIds } },
    select: { id: true, name: true, photo_url: true, institution: true, role: true },
  });

  return { id: conv.id, participants: profiles, created_at: conv.created_at };
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export async function getMessages(conversationId: string, myId: string, cursor?: string, limit = 30) {
  // Verify membership
  const member = await prisma.conversation_participants.findUnique({
    where: { conversation_id_profile_id: { conversation_id: conversationId, profile_id: myId } },
  });
  if (!member) return null;

  const messages = await prisma.messages.findMany({
    where: {
      conversation_id: conversationId,
      ...(cursor && { created_at: { lt: (await prisma.messages.findUnique({ where: { id: cursor } }))?.created_at } }),
    },
    orderBy: { created_at: "desc" },
    take: limit + 1,
  });

  const hasMore = messages.length > limit;
  const page    = messages.slice(0, limit).reverse(); // oldest-first for display

  // Fetch sender profiles
  const senderIds = [...new Set(page.map((m) => m.sender_id))];
  const senders   = await prisma.profiles.findMany({
    where: { id: { in: senderIds } },
    select: { id: true, name: true, photo_url: true },
  });
  const senderMap = new Map(senders.map((s) => [s.id, s]));

  return {
    messages: page.map((m) => ({ ...m, sender: senderMap.get(m.sender_id) ?? null })),
    has_more: hasMore,
    next_cursor: hasMore ? page[0]?.id : null,
  };
}

// Returns null when the sender is not a participant in the conversation.
// Callers must treat null as a 403/404 — never trust the REST or socket
// caller's claim of conversation_id without verifying membership here.
export async function saveMessage(conversationId: string, senderId: string, content: string) {
  const member = await prisma.conversation_participants.findUnique({
    where: { conversation_id_profile_id: { conversation_id: conversationId, profile_id: senderId } },
  });
  if (!member) return null;

  const [message] = await Promise.all([
    prisma.messages.create({
      data: { conversation_id: conversationId, sender_id: senderId, content },
    }),
    // Bump conversation updated_at for sorting
    prisma.conversations.update({
      where: { id: conversationId },
      data: { updated_at: new Date() },
    }),
  ]);

  const sender = await prisma.profiles.findUnique({
    where: { id: senderId },
    select: { id: true, name: true, photo_url: true },
  });

  return { ...message, sender };
}

export async function markRead(conversationId: string, profileId: string) {
  return prisma.conversation_participants.update({
    where: { conversation_id_profile_id: { conversation_id: conversationId, profile_id: profileId } },
    data: { last_read_at: new Date() },
  });
}
