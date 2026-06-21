// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import type { Request, Response } from "express";
import { z } from "zod";
import * as CollectionsService from "../services/collections.service.js";

export const schemas = {
  create: z.object({
    name: z.string().min(1, "Name is required").trim(),
    parentId: z.string().nullish(),
  }),
  rename: z.object({
    name: z.string().min(1, "Name is required").trim(),
  }),
  reorder: z.object({
    orderedIds: z.array(z.string()).min(1, "orderedIds must not be empty"),
  }),
  password: z.object({
    password: z.string().min(1, "Password is required"),
  }),
};

export async function list(req: Request, res: Response): Promise<void> {
  const collections = await CollectionsService.listCollections(req.user!.id);
  res.json({ collections });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { name, parentId } = req.body as z.infer<typeof schemas.create>;
  const collection = await CollectionsService.createCollection(req.user!.id, name, parentId ?? undefined);
  res.status(201).json({ collection });
}

export async function reorder(req: Request, res: Response): Promise<void> {
  const { orderedIds } = req.body as z.infer<typeof schemas.reorder>;
  await CollectionsService.reorderCollections(req.user!.id, orderedIds);
  res.json({ ok: true });
}

export async function rename(req: Request, res: Response): Promise<void> {
  const { name } = req.body as z.infer<typeof schemas.rename>;
  const collection = await CollectionsService.renameCollection(req.user!.id, req.params.id as string, name);
  res.json({ collection });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await CollectionsService.deleteCollection(req.user!.id, req.params.id as string);
  res.json({ ok: true });
}

export async function lock(req: Request, res: Response): Promise<void> {
  const { password } = req.body as z.infer<typeof schemas.password>;
  const collection = await CollectionsService.lockCollection(req.user!.id, req.params.id as string, password);
  res.json({ collection });
}

export async function removeLock(req: Request, res: Response): Promise<void> {
  const { password } = req.body as z.infer<typeof schemas.password>;
  const collection = await CollectionsService.removeLock(req.user!.id, req.params.id as string, password);
  res.json({ collection });
}

export async function unlock(req: Request, res: Response): Promise<void> {
  const { password } = req.body as z.infer<typeof schemas.password>;
  const { unlockToken } = await CollectionsService.unlockCollection(
    req.user!.id,
    req.params.id as string,
    password
  );
  res.json({ valid: true, unlockToken });
}
