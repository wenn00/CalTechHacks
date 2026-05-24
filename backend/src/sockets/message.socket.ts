import { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma";
import { saveMessage, markRead } from "../services/message.service";

// ─── Socket event handlers for messaging ─────────────────────────────────────
//
// CLIENT → SERVER events:
//   join_conversation  { conversationId }  — subscribe to a conversation room
//   send_message       { conversationId, content } — send a message
//   typing             { conversationId }  — broadcast typing indicator
//   mark_read          { conversationId }  — mark messages as read
//
// SERVER → CLIENT events:
//   new_message   { message }        — new message in a conversation
//   user_typing   { userId, conversationId } — someone is typing
//   message_read  { conversationId, userId } — someone marked as read
//   error         { message }        — something went wrong

export function registerMessageHandlers(io: Server, socket: Socket) {
  const userId = (socket as any).user.id as string;

  // ── join_conversation ──────────────────────────────────────────────────────
  socket.on("join_conversation", async ({ conversationId }: { conversationId: string }) => {
    // Verify the user is actually a participant before joining the room
    const member = await prisma.conversation_participants.findUnique({
      where: { conversation_id_profile_id: { conversation_id: conversationId, profile_id: userId } },
    });

    if (!member) {
      socket.emit("error", { message: "Not a participant in this conversation" });
      return;
    }

    socket.join(`conv:${conversationId}`);
  });

  // ── send_message ───────────────────────────────────────────────────────────
  socket.on("send_message", async ({ conversationId, content }: { conversationId: string; content: string }) => {
    if (!content?.trim()) return;

    try {
      // Verify membership
      const member = await prisma.conversation_participants.findUnique({
        where: { conversation_id_profile_id: { conversation_id: conversationId, profile_id: userId } },
      });
      if (!member) {
        socket.emit("error", { message: "Not a participant in this conversation" });
        return;
      }

      const message = await saveMessage(conversationId, userId, content.trim());
      // Defensive: saveMessage returns null if the sender lost membership
      // between the check above and the write (e.g. removed from the conv).
      if (!message) {
        socket.emit("error", { message: "Not a participant in this conversation" });
        return;
      }

      // Broadcast to everyone in the conversation room (including sender)
      io.to(`conv:${conversationId}`).emit("new_message", { message });

      // Also push to participant personal rooms for unread badge updates —
      // but skip peers who are already in the conv room, otherwise they
      // receive `new_message` twice (once from the room broadcast above,
      // once from the personal push).
      const [participants, convSockets] = await Promise.all([
        prisma.conversation_participants.findMany({ where: { conversation_id: conversationId } }),
        io.in(`conv:${conversationId}`).fetchSockets(),
      ]);
      const usersInConvRoom = new Set(
        convSockets.map((s) => (s as any).user?.id).filter(Boolean) as string[],
      );
      participants
        .filter((p) => p.profile_id !== userId)
        .filter((p) => !usersInConvRoom.has(p.profile_id))
        .forEach((p) => {
          io.to(`user:${p.profile_id}`).emit("new_message", { message, conversationId });
        });

    } catch (err) {
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  // ── typing ─────────────────────────────────────────────────────────────────
  socket.on("typing", ({ conversationId }: { conversationId: string }) => {
    // Broadcast to other participants only (not the sender)
    socket.to(`conv:${conversationId}`).emit("user_typing", { userId, conversationId });
  });

  // ── mark_read ──────────────────────────────────────────────────────────────
  socket.on("mark_read", async ({ conversationId }: { conversationId: string }) => {
    try {
      await markRead(conversationId, userId);
      // Let other participants know their message was read
      socket.to(`conv:${conversationId}`).emit("message_read", { conversationId, userId });
    } catch {
      // Non-critical — silently ignore
    }
  });
}
