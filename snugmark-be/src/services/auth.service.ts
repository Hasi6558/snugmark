// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import { User } from "../models/User.js";
import { hashPassword, comparePassword } from "../lib/password.js";
import { signToken } from "../lib/jwt.js";
import { AppError } from "../middleware/error.js";

export async function registerUser(name: string, email: string, password: string) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(409, "email_taken", "An account with this email already exists");
  }
  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash });
  const token = signToken({ id: user._id.toString(), email: user.email });
  return { token, user };
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(401, "invalid_credentials", "Invalid email or password");
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError(401, "invalid_credentials", "Invalid email or password");
  }
  const token = signToken({ id: user._id.toString(), email: user.email });
  return { token, user };
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError(401, "unauthorized", "User not found");
  return user;
}

// Used by both the auth verify-password endpoint and the collections lock/unlock flows.
export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  const user = await User.findById(userId);
  if (!user) throw new AppError(401, "unauthorized", "User not found");
  return comparePassword(password, user.passwordHash);
}
