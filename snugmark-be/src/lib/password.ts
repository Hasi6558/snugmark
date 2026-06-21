// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import bcrypt from "bcrypt";

const COST = 12;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
