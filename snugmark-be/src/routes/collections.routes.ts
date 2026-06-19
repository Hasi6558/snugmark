import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/error.js";
import * as CollectionsController from "../controllers/collections.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(CollectionsController.list));
router.post("/", validate(CollectionsController.schemas.create), asyncHandler(CollectionsController.create));

// /reorder must be declared before /:id to prevent Express matching it as an id
router.patch("/reorder", validate(CollectionsController.schemas.reorder), asyncHandler(CollectionsController.reorder));
router.patch("/:id", validate(CollectionsController.schemas.rename), asyncHandler(CollectionsController.rename));
router.delete("/:id", asyncHandler(CollectionsController.remove));

router.post("/:id/lock", validate(CollectionsController.schemas.password), asyncHandler(CollectionsController.lock));
router.post("/:id/remove-lock", validate(CollectionsController.schemas.password), asyncHandler(CollectionsController.removeLock));
router.post("/:id/unlock", validate(CollectionsController.schemas.password), asyncHandler(CollectionsController.unlock));

export default router;
