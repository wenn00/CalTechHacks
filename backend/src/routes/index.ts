import { Router } from "express";
import authRoutes     from "./auth.routes";
import attendeeRoutes from "./attendee.routes";
import profileRoutes  from "./profile.routes";
import messageRoutes  from "./message.routes";

export const router = Router();

router.use("/auth",      authRoutes);
router.use("/attendees", attendeeRoutes);
router.use("/profile",   profileRoutes);
router.use("/messages",  messageRoutes);
