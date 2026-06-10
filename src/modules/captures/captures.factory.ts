import { ImageComparisonService } from "./services/ImageComparisonService.js";
import { CapturesService } from "./services/CapturesService.js";
import { NodemailerEmailProvider } from "./providers/NodemailerEmailProvider.js";
import { LocalStorageProvider } from "./providers/LocalStorageProvider.js";
import { SupabaseStorageProvider } from "./providers/SupabaseStorageProvider.js";
import { GoogleDriveStorageProvider } from "./providers/GoogleDriveStorageProvider.js";
import { JsonCapturesRepository } from "./repositories/JsonCapturesRepository.js";
import { SupabaseCapturesRepository } from "./repositories/SupabaseCapturesRepository.js";
import { env } from "../../config/env.js";

const capturesRepository =
  env.CAPTURES_REPOSITORY === "supabase"
    ? new SupabaseCapturesRepository()
    : new JsonCapturesRepository();
const storageProvider = makeStorageProvider();
const imageComparisonService = new ImageComparisonService();
const emailProvider = new NodemailerEmailProvider();

export const capturesService = new CapturesService(
  capturesRepository,
  storageProvider,
  imageComparisonService,
  emailProvider
);

function makeStorageProvider() {
  switch (env.STORAGE_PROVIDER) {
    case "google-drive":
      return new GoogleDriveStorageProvider();
    case "supabase":
      return new SupabaseStorageProvider();
    case "local":
      return new LocalStorageProvider();
  }
}
