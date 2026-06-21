// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/error.js";
import * as MetadataController from "../controllers/metadata.controller.js";

const router = Router();
router.use(requireAuth);

router.post("/", validate(MetadataController.schemas.fetch), asyncHandler(MetadataController.fetchMetadata));

export default router;
