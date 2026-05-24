import { Response, NextFunction } from "express";
import * as svc from "../services/message.service";
import { AuthRequest } from "../types";
import { ok, fail, paginated } from "../utils/response";
import { messagesQuerySchema } from "../validators/message";

export async function createConversation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { participantId } = req.body;
    if (participantId === req.user!.id) return fail(res, "Cannot message yourself");
    const conv = await svc.getOrCreateConversation(req.user!.id, participantId);
    ok(res, conv, 201);
  } catch (err) { next(err); }
}

export async function listConversations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const raw  = await svc.listConversations(req.user!.id);
    const data = await svc.withUnreadCounts(raw, req.user!.id);
    ok(res, data);
  } catch (err) { next(err); }
}

export async function getConversation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const conv = await svc.getConversationById(req.params.id as string, req.user!.id);
    if (!conv) return fail(res, "Conversation not found", 404);
    ok(res, conv);
  } catch (err) { next(err); }
}

export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { cursor, limit } = messagesQuerySchema.parse(req.query);
    const result = await svc.getMessages(req.params.id as string, req.user!.id, cursor, limit);
    if (!result) return fail(res, "Conversation not found or access denied", 404);
    ok(res, result);
  } catch (err) { next(err); }
}

export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const message = await svc.saveMessage(req.params.id as string, req.user!.id, req.body.content);
    if (!message) return fail(res, "Conversation not found or access denied", 404);
    ok(res, message, 201);
  } catch (err) { next(err); }
}

export async function markRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await svc.markRead(req.params.id as string, req.user!.id);
    ok(res, { marked: true });
  } catch (err) { next(err); }
}
