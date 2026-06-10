import { env } from "../../../config/env.js";
import { getStorageBucket } from "../../../config/firebase.js";
import type { SaveImageInput, SaveImageOutput, StorageProvider } from "./StorageProvider.js";

export class FirebaseStorageProvider implements StorageProvider {
  async saveImage(input: SaveImageInput): Promise<SaveImageOutput> {
    const bucket = getStorageBucket();
    const devicePath = safePathSegment(input.deviceId);
    const imagePath = `captures/${devicePath}/${input.id}.jpg`;
    const file = bucket.file(imagePath);

    await file.save(input.buffer, {
      resumable: false,
      metadata: {
        contentType: input.mimeType,
        cacheControl: "public, max-age=31536000"
      }
    });

    const [imageUrl] = await file.getSignedUrl({
      action: "read",
      expires: env.FIREBASE_SIGNED_URL_EXPIRES
    });

    return {
      imagePath,
      imageUrl
    };
  }

  async getImageBuffer(imagePath: string): Promise<Buffer> {
    const [buffer] = await getStorageBucket().file(imagePath).download();
    return buffer;
  }
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_") || "device";
}
