// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import type { NextFunction, Request, Response, RequestHandler } from "express";
import { ZodError } from "zod";

// Application error with an HTTP status and a stable machine-readable code.
// Throw this from anywhere in a handler/service and the central error handler
// turns it into a consistent JSON response.
export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "AppError";
  }
}

// Wrap async route handlers so rejected promises are forwarded to Express's
// error pipeline instead of crashing the process / hanging the request.
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 fallthrough for unmatched routes.
export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(404, "not_found", "Resource not found"));
}

// Central error handler. Must keep the 4-arg signature so Express recognizes it.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "validation_error",
        message: "Request validation failed",
        details: err.flatten().fieldErrors,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    error: { code: "internal_error", message: "Something went wrong" },
  });
}
