import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/error.js";
import * as TagsController from "../controllers/tags.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(TagsController.list));
router.post("/", validate(TagsController.schemas.create), asyncHandler(TagsController.create));

export default router;
