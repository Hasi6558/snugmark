import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/error.js";
import * as LinksController from "../controllers/links.controller.js";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(LinksController.list));
router.post("/", validate(LinksController.schemas.create), asyncHandler(LinksController.create));

// /reorder must be declared before /:id
router.patch("/reorder", validate(LinksController.schemas.reorder), asyncHandler(LinksController.reorder));
router.patch("/:id", validate(LinksController.schemas.update), asyncHandler(LinksController.update));
router.delete("/:id", asyncHandler(LinksController.remove));

router.post("/:id/visit", asyncHandler(LinksController.visit));
router.patch("/:id/move", validate(LinksController.schemas.move), asyncHandler(LinksController.move));

export default router;
