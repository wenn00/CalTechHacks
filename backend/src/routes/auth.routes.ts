import { Router } from "express";
import { me } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Login/register are handled by Supabase Auth on the frontend.
// This endpoint returns the current user's profile from their Supabase JWT.
router.get("/me", requireAuth, me);

export default router;
