import type { Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../../shared/errors/AppError.js";
import { capturesService } from "./captures.factory.js";

const listQuerySchema = z.object({
  deviceId: z.string().trim().min(1).optional(),
  motionDetected: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20)
});

const latestQuerySchema = z.object({
  deviceId: z.string().trim().min(1)
});

export class CapturesController {
  async create(request: Request, response: Response): Promise<Response> {
    if (!request.is("image/jpeg")) {
      throw new AppError("Content-Type must be image/jpeg", 415);
    }

    const capture = await capturesService.create({
      image: request.body as Buffer,
      deviceId: headerToString(request.headers["x-device-id"]),
      captureSource: headerToString(request.headers["x-capture-source"]),
      triggerCommand: headerToString(request.headers["x-trigger-command"])
    });

    return response.status(201).json(toCaptureResponse(capture));
  }

  async list(request: Request, response: Response): Promise<Response> {
    const filters = listQuerySchema.parse(request.query);
    const result = await capturesService.list(filters);

    return response.json({
      ...result,
      data: result.data.map(toCaptureResponse)
    });
  }

  async latest(request: Request, response: Response): Promise<Response> {
    const { deviceId } = latestQuerySchema.parse(request.query);
    const capture = await capturesService.getLatest(deviceId);

    return response.json(toCaptureResponse(capture));
  }

  async show(request: Request, response: Response): Promise<Response> {
    const capture = await capturesService.getById(request.params.id);

    return response.json(toCaptureResponse(capture));
  }
}

function headerToString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function toCaptureResponse(capture: Awaited<ReturnType<typeof capturesService.getById>>) {
  return {
    id: capture.id,
    deviceId: capture.deviceId,
    captureSource: capture.captureSource,
    imageUrl: capture.imageUrl,
    imagePath: capture.imagePath,
    sizeBytes: capture.sizeBytes,
    mimeType: capture.mimeType,
    capturedAt: capture.capturedAt,
    triggerCommand: capture.triggerCommand,
    diffScore: capture.diffScore ?? 0,
    motionDetected: capture.motionDetected,
    emailAlertSent: capture.emailAlertSent
  };
}
