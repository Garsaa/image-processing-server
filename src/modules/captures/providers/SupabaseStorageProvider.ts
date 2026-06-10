import { env } from "../../../config/env.js";
import { getSupabaseClient } from "../../../config/supabase.js";
import { AppError } from "../../../shared/errors/AppError.js";
import type { SaveImageInput, SaveImageOutput, StorageProvider } from "./StorageProvider.js";

export class SupabaseStorageProvider implements StorageProvider {
  async saveImage(input: SaveImageInput): Promise<SaveImageOutput> {
    const supabase = getSupabaseClient();
    const devicePath = safePathSegment(input.deviceId);
    const imagePath = `captures/${devicePath}/${input.id}.jpg`;

    const { error } = await supabase.storage.from(env.SUPABASE_BUCKET).upload(imagePath, input.buffer, {
      contentType: input.mimeType,
      upsert: false
    });

    if (error) {
      throw new AppError("Failed to upload image to Supabase Storage", 500, error.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from(env.SUPABASE_BUCKET)
      .getPublicUrl(imagePath);

    return {
      imagePath,
      imageUrl: publicUrlData.publicUrl
    };
  }

  async getImageBuffer(imagePath: string): Promise<Buffer> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage.from(env.SUPABASE_BUCKET).download(imagePath);

    if (error) {
      throw new AppError("Failed to download image from Supabase Storage", 500, error.message);
    }

    return Buffer.from(await data.arrayBuffer());
  }
}

function safePathSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_") || "device";
}
