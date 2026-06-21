// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../lib/jwt.js";
import { AppError } from "./error.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "unauthorized", "Missing or invalid Authorization header"));
    return;
  }
  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new AppError(401, "unauthorized", "Invalid or expired token"));
  }
}
