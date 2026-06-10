import { randomUUID } from "node:crypto";
import { env } from "../../../config/env.js";
import { AppError } from "../../../shared/errors/AppError.js";
import type {
  Capture,
  CreateCaptureInput,
  ListCapturesFilters,
  PaginatedCaptures
} from "../capture.types.js";
import type { CapturesRepository } from "../repositories/CapturesRepository.js";
import type { EmailProvider } from "../providers/EmailProvider.js";
import type { StorageProvider } from "../providers/StorageProvider.js";
import { ImageComparisonService } from "./ImageComparisonService.js";

export class CapturesService {
  constructor(
    private readonly capturesRepository: CapturesRepository,
    private readonly storageProvider: StorageProvider,
    private readonly imageComparisonService: ImageComparisonService,
    private readonly emailProvider: EmailProvider
  ) {}

  async create(input: CreateCaptureInput): Promise<Capture> {
    if (!input.image?.length) {
      throw new AppError("Image body is required", 400);
    }

    if (input.image.length > env.MAX_IMAGE_SIZE_BYTES) {
      throw new AppError("Image exceeds maximum allowed size", 413, {
        maxImageSizeBytes: env.MAX_IMAGE_SIZE_BYTES
      });
    }

    const isJpeg = await this.imageComparisonService.isJpeg(input.image);

    if (!isJpeg) {
      throw new AppError("Invalid JPEG image", 400);
    }

    const id = randomUUID();
    const deviceId = input.deviceId?.trim() || "esp32cam-unknown";
    const previousCapture = await this.capturesRepository.findLatestByDeviceId(deviceId);
    const { imageUrl, imagePath } = await this.storageProvider.saveImage({
      id,
      deviceId,
      buffer: input.image,
      mimeType: "image/jpeg"
    });

    const diffScore = await this.calculateDiffScore(input.image, previousCapture);
    const motionDetected = diffScore >= env.MOTION_DIFF_THRESHOLD;
    let emailAlertSent = false;
    const capturedAt = new Date().toISOString();

    if (motionDetected) {
      emailAlertSent = await this.emailProvider.sendMotionAlert({
        deviceId,
        capturedAt,
        diffScore,
        imageUrl
      });
    }

    const capture: Capture = {
      id,
      deviceId,
      captureSource: input.captureSource,
      imageUrl,
      imagePath,
      sizeBytes: input.image.length,
      mimeType: "image/jpeg",
      capturedAt,
      triggerCommand: input.triggerCommand,
      diffScore,
      motionDetected,
      emailAlertSent
    };

    console.log("[captures] created", {
      id,
      deviceId,
      diffScore,
      motionDetected,
      emailAlertSent
    });

    return this.capturesRepository.create(capture);
  }

  async list(filters: ListCapturesFilters): Promise<PaginatedCaptures> {
    return this.capturesRepository.list(filters);
  }

  async getById(id: string): Promise<Capture> {
    const capture = await this.capturesRepository.findById(id);

    if (!capture) {
      throw new AppError("Capture not found", 404);
    }

    return capture;
  }

  async getLatest(deviceId: string): Promise<Capture> {
    const capture = await this.capturesRepository.findLatestByDeviceId(deviceId);

    if (!capture) {
      throw new AppError("No captures found for this device", 404);
    }

    return capture;
  }

  private async calculateDiffScore(currentImage: Buffer, previousCapture: Capture | null) {
    if (!previousCapture) {
      return 0;
    }

    try {
      const previousImage = await this.storageProvider.getImageBuffer(previousCapture.imagePath);
      return this.imageComparisonService.compare(currentImage, previousImage);
    } catch (error) {
      console.error("[captures] failed to compare with previous capture", {
        previousCaptureId: previousCapture.id,
        error
      });

      return 0;
    }
  }
}
