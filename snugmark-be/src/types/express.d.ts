// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
    }
  }
}

export {};
