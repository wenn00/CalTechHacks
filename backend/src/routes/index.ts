import { Router } from "express";
import authRoutes     from "./auth.routes";
import attendeeRoutes from "./attendee.routes";
import profileRoutes  from "./profile.routes";
import messageRoutes  from "./message.routes";
import matchRoutes    from "./match.routes";
import graphRoutes    from "./graph.routes";
import socialRoutes   from "./social.routes";

export const router = Router();

router.use("/auth",      authRoutes);
router.use("/attendees", attendeeRoutes);
router.use("/profile",   profileRoutes);
router.use("/messages",  messageRoutes);
router.use("/matches",   matchRoutes);
router.use("/graph",     graphRoutes);
router.use("/social",    socialRoutes);
