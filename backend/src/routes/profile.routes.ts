import { Router } from "express";
import * as profile from "../controllers/profile.controller";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { updateProfileSchema } from "../validators/profile";

const router = Router();

// All profile routes require a logged-in user
router.use(requireAuth);

router.get("/",  profile.getMyProfile);
router.put("/",  validate(updateProfileSchema), profile.updateMyProfile);

export default router;
