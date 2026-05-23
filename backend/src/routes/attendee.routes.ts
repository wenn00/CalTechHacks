import { Router } from "express";
import * as attendee from "../controllers/attendee.controller";
import { apiLimiter } from "../middleware/rateLimit";

const router = Router();

// Apply general rate limit to all attendee routes
router.use(apiLimiter);

// GET /api/attendees?q=&researchArea=&institution=&careerStage=&page=&limit=
// Handles both browsing (no q) and searching (with q) in one endpoint.
router.get("/",         attendee.listAttendees);

// GET /api/attendees/filters — dropdown options for search UI
router.get("/filters",  attendee.getFilterOptions);

// GET /api/attendees/:id — single public profile
router.get("/:id",      attendee.getAttendee);

export default router;
