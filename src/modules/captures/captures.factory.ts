import { ImageComparisonService } from "./services/ImageComparisonService.js";
import { CapturesService } from "./services/CapturesService.js";
import { NodemailerEmailProvider } from "./providers/NodemailerEmailProvider.js";
import { LocalStorageProvider } from "./providers/LocalStorageProvider.js";
import { SupabaseStorageProvider } from "./providers/SupabaseStorageProvider.js";
import { JsonCapturesRepository } from "./repositories/JsonCapturesRepository.js";
import { SupabaseCapturesRepository } from "./repositories/SupabaseCapturesRepository.js";
import { env } from "../../config/env.js";

const capturesRepository =
  env.CAPTURES_REPOSITORY === "supabase"
    ? new SupabaseCapturesRepository()
    : new JsonCapturesRepository();
const storageProvider =
  env.STORAGE_PROVIDER === "supabase" ? new SupabaseStorageProvider() : new LocalStorageProvider();
const imageComparisonService = new ImageComparisonService();
const emailProvider = new NodemailerEmailProvider();

export const capturesService = new CapturesService(
  capturesRepository,
  storageProvider,
  imageComparisonService,
  emailProvider
);
