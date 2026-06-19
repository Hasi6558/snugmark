import type { Request, Response } from "express";
import { z } from "zod";
import * as AuthService from "../services/auth.service.js";

export const schemas = {
  register: z.object({
    name: z.string().min(1, "Name is required").trim(),
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
  login: z.object({
    email: z.string().email().toLowerCase().trim(),
    password: z.string().min(1, "Password is required"),
  }),
  verifyPassword: z.object({
    password: z.string().min(1, "Password is required"),
  }),
};

export async function register(req: Request, res: Response): Promise<void> {
  const { name, email, password } = req.body as z.infer<typeof schemas.register>;
  const result = await AuthService.registerUser(name, email, password);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as z.infer<typeof schemas.login>;
  const result = await AuthService.loginUser(email, password);
  res.json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await AuthService.getCurrentUser(req.user!.id);
  res.json({ user });
}

export async function verifyPassword(req: Request, res: Response): Promise<void> {
  const { password } = req.body as z.infer<typeof schemas.verifyPassword>;
  const valid = await AuthService.verifyUserPassword(req.user!.id, password);
  res.json({ valid });
}
