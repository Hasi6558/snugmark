import jwt from "jsonwebtoken";
import { env } from "../env.js";

export interface JwtPayload {
  id: string;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string") {
    throw new Error("Invalid token payload");
  }
  return decoded as JwtPayload;
}

// Short-lived tokens issued by POST /collections/:id/unlock.
// Scoped to a single collection + user; expires in 1 h.
export function signUnlockToken(collectionId: string, userId: string): string {
  return jwt.sign(
    { collectionId, userId, type: "collection_unlock" },
    env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

export function verifyUnlockToken(token: string): { collectionId: string; userId: string } {
  const decoded = jwt.verify(token, env.JWT_SECRET) as {
    collectionId: string;
    userId: string;
    type: string;
  };
  if (decoded.type !== "collection_unlock") {
    throw new Error("Invalid token type");
  }
  return { collectionId: decoded.collectionId, userId: decoded.userId };
}
