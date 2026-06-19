import type { Request, Response } from "express";
import { z } from "zod";
import * as TagsService from "../services/tags.service.js";

export const schemas = {
  create: z.object({
    name: z.string().min(1, "Name is required").trim(),
  }),
};

export async function list(req: Request, res: Response): Promise<void> {
  const tags = await TagsService.listTags(req.user!.id);
  res.json({ tags });
}

export async function create(req: Request, res: Response): Promise<void> {
  const { name } = req.body as z.infer<typeof schemas.create>;
  const { tag, created } = await TagsService.findOrCreateTag(req.user!.id, name);
  res.status(created ? 201 : 200).json({ tag });
}
