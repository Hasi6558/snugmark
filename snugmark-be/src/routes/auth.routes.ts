import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/error.js";
import * as AuthController from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", validate(AuthController.schemas.register), asyncHandler(AuthController.register));
router.post("/login", validate(AuthController.schemas.login), asyncHandler(AuthController.login));
router.get("/me", requireAuth, asyncHandler(AuthController.me));
router.post("/verify-password", requireAuth, validate(AuthController.schemas.verifyPassword), asyncHandler(AuthController.verifyPassword));

export default router;
