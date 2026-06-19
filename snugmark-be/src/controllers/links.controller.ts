import type { Request, Response } from "express";
import { z } from "zod";
import * as LinksService from "../services/links.service.js";

export const schemas = {
  create: z.object({
    collectionId: z.string().min(1, "collectionId is required"),
    url: z.string().url("Must be a valid URL"),
    title: z.string().trim().optional(),
    description: z.string().trim().optional(),
    favicon: z.string().trim().optional(),
    tagIds: z.array(z.string()).optional(),
  }),
  update: z.object({
    url: z.string().url("Must be a valid URL").optional(),
    title: z.string().trim().optional(),
    description: z.string().trim().optional(),
    favicon: z.string().trim().optional(),
    tagIds: z.array(z.string()).optional(),
    isFavourite: z.boolean().optional(),
    isRead: z.boolean().optional(),
  }),
  move: z.object({
    targetCollectionId: z.string().min(1, "targetCollectionId is required"),
  }),
  reorder: z.object({
    collectionId: z.string().min(1, "collectionId is required"),
    orderedIds: z.array(z.string()).min(1, "orderedIds must not be empty"),
  }),
};

export async function list(req: Request, res: Response): Promise<void> {
  const links = await LinksService.listLinks(req.user!.id);
  res.json({ links });
}

export async function create(req: Request, res: Response): Promise<void> {
  const data = req.body as z.infer<typeof schemas.create>;
  const link = await LinksService.createLink(req.user!.id, data);
  res.status(201).json({ link });
}

export async function update(req: Request, res: Response): Promise<void> {
  const data = req.body as z.infer<typeof schemas.update>;
  const link = await LinksService.updateLink(req.user!.id, req.params.id as string, data);
  res.json({ link });
}

export async function remove(req: Request, res: Response): Promise<void> {
  await LinksService.deleteLink(req.user!.id, req.params.id as string);
  res.json({ ok: true });
}

export async function visit(req: Request, res: Response): Promise<void> {
  const link = await LinksService.recordVisit(req.user!.id, req.params.id as string);
  res.json({ link });
}

export async function move(req: Request, res: Response): Promise<void> {
  const { targetCollectionId } = req.body as z.infer<typeof schemas.move>;
  const link = await LinksService.moveLink(req.user!.id, req.params.id as string, targetCollectionId);
  res.json({ link });
}

export async function reorder(req: Request, res: Response): Promise<void> {
  const { collectionId, orderedIds } = req.body as z.infer<typeof schemas.reorder>;
  await LinksService.reorderLinks(req.user!.id, collectionId, orderedIds);
  res.json({ ok: true });
}
