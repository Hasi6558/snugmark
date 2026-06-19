import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { hashPassword, comparePassword } from "../lib/password.js";
import { signToken } from "../lib/jwt.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler, AppError } from "../middleware/error.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

const verifyPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

// POST /api/auth/register
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body as z.infer<typeof registerSchema>;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError(409, "email_taken", "An account with this email already exists");
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({ name, email, passwordHash });

    const token = signToken({ id: user._id.toString(), email: user.email });
    res.status(201).json({ token, user });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;

    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError(401, "invalid_credentials", "Invalid email or password");
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "invalid_credentials", "Invalid email or password");
    }

    const token = signToken({ id: user._id.toString(), email: user.email });
    res.json({ token, user });
  })
);

// GET /api/auth/me
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.id);
    if (!user) {
      throw new AppError(401, "unauthorized", "User not found");
    }
    res.json({ user });
  })
);

// POST /api/auth/verify-password
router.post(
  "/verify-password",
  requireAuth,
  validate(verifyPasswordSchema),
  asyncHandler(async (req, res) => {
    const { password } = req.body as z.infer<typeof verifyPasswordSchema>;

    const user = await User.findById(req.user!.id);
    if (!user) {
      throw new AppError(401, "unauthorized", "User not found");
    }

    const valid = await comparePassword(password, user.passwordHash);
    res.json({ valid });
  })
);

export default router;
