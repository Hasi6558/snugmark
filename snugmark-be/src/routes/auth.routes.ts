// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/error.js";
import * as AuthController from "../controllers/auth.controller.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Too many login attempts. Please try again later." } },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "rate_limited", message: "Too many accounts created from this IP. Please try again later." } },
});

router.post("/register", registerLimiter, validate(AuthController.schemas.register), asyncHandler(AuthController.register));
router.post("/login", loginLimiter, validate(AuthController.schemas.login), asyncHandler(AuthController.login));
router.get("/me", requireAuth, asyncHandler(AuthController.me));
router.post("/logout", requireAuth, asyncHandler(AuthController.logout));
router.post("/verify-password", requireAuth, validate(AuthController.schemas.verifyPassword), asyncHandler(AuthController.verifyPassword));

export default router;
