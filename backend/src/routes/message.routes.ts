import { Router } from "express";
import * as msg from "../controllers/message.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createConversationSchema, sendMessageSchema } from "../validators/message";

const router = Router();

// Health check — no auth needed
router.get("/ping", (_req, res) => res.json({ success: true, message: "Messaging API is live" }));

// All messaging routes require auth
router.use(requireAuth);

// Conversations
router.post  ("/conversations",            validate(createConversationSchema), msg.createConversation);
router.get   ("/conversations",            msg.listConversations);
router.get   ("/conversations/:id",        msg.getConversation);

// Messages within a conversation
router.get   ("/conversations/:id/messages", msg.getMessages);
router.post  ("/conversations/:id/messages", validate(sendMessageSchema), msg.sendMessage);

// Mark conversation as read
router.put   ("/conversations/:id/read",   msg.markRead);

export default router;
