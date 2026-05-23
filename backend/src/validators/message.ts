import { z } from "zod";

export const createConversationSchema = z.object({
  participantId: z.string().uuid(), // the other person's profiles.id
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000).trim(),
});

export const messagesQuerySchema = z.object({
  cursor: z.string().optional(), // message id for cursor-based pagination
  limit:  z.coerce.number().int().min(1).max(50).default(30),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput        = z.infer<typeof sendMessageSchema>;
export type MessagesQuery           = z.infer<typeof messagesQuerySchema>;
