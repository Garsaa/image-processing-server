import { Router, raw } from "express";
import { env } from "../../config/env.js";
import { asyncHandler } from "../../shared/middlewares/asyncHandler.js";
import { CapturesController } from "./captures.controller.js";

const capturesController = new CapturesController();

export const capturesRouter = Router();

capturesRouter.post(
  "/",
  raw({ type: "image/jpeg", limit: env.MAX_IMAGE_SIZE_BYTES }),
  asyncHandler(capturesController.create)
);
capturesRouter.get("/", asyncHandler(capturesController.list));
capturesRouter.get("/latest", asyncHandler(capturesController.latest));
capturesRouter.get("/:id", asyncHandler(capturesController.show));
