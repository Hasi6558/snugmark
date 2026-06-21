// Copyright (c) 2026 Hasindu Shehan Liyanage. All Rights Reserved.
// This code may not be copied, modified, distributed, or used in production without written permission.

import type { Request, Response } from "express";
import { z } from "zod";
import * as MetadataService from "../services/metadata.service.js";

export const schemas = {
  fetch: z.object({
    url: z.string().min(1, "URL is required"),
  }),
};

export async function fetchMetadata(req: Request, res: Response): Promise<void> {
  const { url } = req.body as z.infer<typeof schemas.fetch>;
  const metadata = await MetadataService.fetchMetadata(url);
  res.json(metadata);
}
