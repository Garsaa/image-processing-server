import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../../config/env.js";
import { ensureDir } from "../../../shared/utils/ensureDir.js";
import type { SaveImageInput, SaveImageOutput, StorageProvider } from "./StorageProvider.js";

export class LocalStorageProvider implements StorageProvider {
  async saveImage(input: SaveImageInput): Promise<SaveImageOutput> {
    const devicePath = safePathSegment(input.deviceId);
    const deviceDir = path.join(env.UPLOAD_DIR, devicePath);
    await ensureDir(deviceDir);

    const fileName = `${input.id}.jpg`;
    const imagePath = path.join(deviceDir, fileName);
    await writeFile(imagePath, input.buffer);

    const publicPath = `/uploads/${devicePath}/${fileName}`;

    return {
      imagePath,
      imageUrl: new URL(publicPath, env.PUBLIC_BASE_URL).toString()
    };
  }

  async getImageBuffer(imagePath: string): Promise<Buffer> {
    return readFile(imagePath);
  }
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_") || "device";
}
