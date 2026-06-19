import { Router } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { Collection } from "../models/Collection.js";
import { Link } from "../models/Link.js";
import { User } from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler, AppError } from "../middleware/error.js";
import { comparePassword } from "../lib/password.js";

const router = Router();
router.use(requireAuth);

// ── Zod schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  parentId: z.string().optional(),
});

const renameSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
});

const reorderSchema = z.object({
  orderedIds: z.array(z.string()).min(1, "orderedIds must not be empty"),
});

const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

// ── Ownership helper ─────────────────────────────────────────────────────────

async function getOwned(id: string, userId: string) {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(404, "not_found", "Collection not found");
  }
  const col = await Collection.findOne({ _id: id, userId });
  if (!col) throw new AppError(404, "not_found", "Collection not found");
  return col;
}

// ── Password verify helper (for lock routes) ─────────────────────────────────

async function verifyUserPassword(userId: string, password: string): Promise<void> {
  const user = await User.findById(userId);
  if (!user) throw new AppError(401, "unauthorized", "User not found");
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) throw new AppError(403, "invalid_password", "Incorrect password");
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /api/collections — list all user collections sorted by order
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const collections = await Collection.find({ userId: req.user!.id }).sort({ order: 1 });
    res.json({ collections });
  })
);

// POST /api/collections — create a collection
router.post(
  "/",
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { name, parentId } = req.body as z.infer<typeof createSchema>;
    const userId = req.user!.id;

    // Validate parentId refers to an owned collection
    if (parentId) {
      await getOwned(parentId, userId);
    }

    // order = number of existing siblings
    const siblingCount = await Collection.countDocuments({
      userId,
      parentId: parentId ?? null,
    });

    const collection = await Collection.create({
      userId,
      parentId: parentId ?? null,
      name,
      order: siblingCount,
    });

    res.status(201).json({ collection });
  })
);

// PATCH /api/collections/reorder — must be declared before /:id
router.patch(
  "/reorder",
  validate(reorderSchema),
  asyncHandler(async (req, res) => {
    const { orderedIds } = req.body as z.infer<typeof reorderSchema>;
    const userId = req.user!.id;

    // Bulk-update order for each top-level collection in the given sequence
    await Promise.all(
      orderedIds.map((id, index) =>
        Collection.updateOne({ _id: id, userId, parentId: null }, { order: index })
      )
    );

    res.json({ ok: true });
  })
);

// PATCH /api/collections/:id — rename
router.patch(
  "/:id",
  validate(renameSchema),
  asyncHandler(async (req, res) => {
    const col = await getOwned(req.params.id as string, req.user!.id);
    col.name = (req.body as z.infer<typeof renameSchema>).name;
    await col.save();
    res.json({ collection: col });
  })
);

// DELETE /api/collections/:id — cascade delete children + all their links
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const col = await getOwned(req.params.id as string, userId);
    const colId = col._id;

    // Collect this collection + all its direct children
    const children = await Collection.find({ userId, parentId: colId });
    const allIds = [colId, ...children.map((c) => c._id)];

    // Delete all links belonging to any of those collections
    await Link.deleteMany({ userId, collectionId: { $in: allIds } });

    // Delete the collections themselves
    await Collection.deleteMany({ _id: { $in: allIds } });

    res.json({ ok: true });
  })
);

// POST /api/collections/:id/lock — verify password, set locked=true
router.post(
  "/:id/lock",
  validate(passwordSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    await verifyUserPassword(userId, (req.body as z.infer<typeof passwordSchema>).password);
    const col = await getOwned(req.params.id as string, userId);
    col.locked = true;
    await col.save();
    res.json({ collection: col });
  })
);

// POST /api/collections/:id/remove-lock — verify password, set locked=false
router.post(
  "/:id/remove-lock",
  validate(passwordSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    await verifyUserPassword(userId, (req.body as z.infer<typeof passwordSchema>).password);
    const col = await getOwned(req.params.id as string, userId);
    col.locked = false;
    await col.save();
    res.json({ collection: col });
  })
);

// POST /api/collections/:id/unlock — verify password only, no DB change
router.post(
  "/:id/unlock",
  validate(passwordSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    await verifyUserPassword(userId, (req.body as z.infer<typeof passwordSchema>).password);
    // Confirm the collection exists and is owned
    await getOwned(req.params.id as string, userId);
    res.json({ valid: true });
  })
);

export default router;
