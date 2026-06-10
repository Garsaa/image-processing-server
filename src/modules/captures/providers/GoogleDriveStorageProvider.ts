import { Readable } from "node:stream";
import { google, type drive_v3 } from "googleapis";
import { env } from "../../../config/env.js";
import { AppError } from "../../../shared/errors/AppError.js";
import type { SaveImageInput, SaveImageOutput, StorageProvider } from "./StorageProvider.js";

const IMAGE_PATH_PREFIX = "google-drive:";

export class GoogleDriveStorageProvider implements StorageProvider {
  private drive: drive_v3.Drive | null = null;

  async saveImage(input: SaveImageInput): Promise<SaveImageOutput> {
    const drive = this.getDriveClient();
    const devicePath = safePathSegment(input.deviceId);
    const fileName = `${devicePath}-${input.id}.jpg`;

    try {
      const { data } = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: input.mimeType,
          parents: env.GOOGLE_DRIVE_FOLDER_ID ? [env.GOOGLE_DRIVE_FOLDER_ID] : undefined
        },
        media: {
          mimeType: input.mimeType,
          body: Readable.from([input.buffer])
        },
        fields: "id",
        supportsAllDrives: true
      });

      if (!data.id) {
        throw new AppError("Google Drive did not return a file id", 500);
      }

      await drive.permissions.create({
        fileId: data.id,
        requestBody: {
          type: "anyone",
          role: "reader"
        },
        fields: "id",
        supportsAllDrives: true
      });

      return {
        imagePath: `${IMAGE_PATH_PREFIX}${data.id}`,
        imageUrl: buildPublicImageUrl(data.id)
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Failed to upload image to Google Drive", 500, getErrorMessage(error));
    }
  }

  async getImageBuffer(imagePath: string): Promise<Buffer> {
    const drive = this.getDriveClient();
    const fileId = parseImagePath(imagePath);

    try {
      const response = await drive.files.get(
        {
          fileId,
          alt: "media",
          supportsAllDrives: true
        },
        {
          responseType: "arraybuffer"
        }
      );

      return Buffer.from(response.data as ArrayBuffer);
    } catch (error) {
      throw new AppError("Failed to download image from Google Drive", 500, getErrorMessage(error));
    }
  }

  private getDriveClient(): drive_v3.Drive {
    if (this.drive) {
      return this.drive;
    }

    const clientId = requiredEnv("GOOGLE_DRIVE_CLIENT_ID", env.GOOGLE_DRIVE_CLIENT_ID);
    const clientSecret = requiredEnv("GOOGLE_DRIVE_CLIENT_SECRET", env.GOOGLE_DRIVE_CLIENT_SECRET);
    const refreshToken = requiredEnv("GOOGLE_DRIVE_REFRESH_TOKEN", env.GOOGLE_DRIVE_REFRESH_TOKEN);
    const auth = new google.auth.OAuth2(clientId, clientSecret);
    auth.setCredentials({ refresh_token: refreshToken });

    this.drive = google.drive({ version: "v3", auth });
    return this.drive;
  }
}

function parseImagePath(imagePath: string): string {
  if (!imagePath.startsWith(IMAGE_PATH_PREFIX)) {
    throw new AppError("Invalid Google Drive image path", 500, { imagePath });
  }

  const fileId = imagePath.slice(IMAGE_PATH_PREFIX.length);

  if (!fileId) {
    throw new AppError("Invalid Google Drive file id", 500, { imagePath });
  }

  return fileId;
}

function buildPublicImageUrl(fileId: string): string {
  if (env.GOOGLE_DRIVE_PUBLIC_URL_TEMPLATE) {
    return env.GOOGLE_DRIVE_PUBLIC_URL_TEMPLATE.replace("{fileId}", encodeURIComponent(fileId));
  }

  return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`;
}

function requiredEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new AppError(`${name} is required when STORAGE_PROVIDER=google-drive`, 500);
  }

  return value;
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_") || "device";
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
