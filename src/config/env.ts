import "dotenv/config";
import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional()
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().min(1).default("uploads"),
  DATA_DIR: z.string().min(1).default("data"),
  STORAGE_PROVIDER: z.enum(["local", "supabase"]).default("local"),
  CAPTURES_REPOSITORY: z.enum(["json", "supabase"]).default("json"),
  MAX_IMAGE_SIZE_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  MOTION_DIFF_THRESHOLD: z.coerce.number().nonnegative().default(25),
  SUPABASE_URL: z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional()),
  SUPABASE_SECRET_KEY: optionalString,
  SUPABASE_BUCKET: z.string().min(1).default("captures"),
  SUPABASE_CAPTURES_TABLE: z.string().min(1).default("captures"),
  MAIL_HOST: optionalString,
  MAIL_PORT: z.coerce.number().int().positive().default(587),
  MAIL_SECURE: z
    .string()
    .transform((value) => value === "true")
    .default("false"),
  MAIL_USER: optionalString,
  MAIL_PASS: optionalString,
  MAIL_FROM: optionalString,
  ALERT_EMAIL_TO: z.string().email().default("gabriel.garcia.dev@gmail.com")
});

export const env = envSchema.parse(process.env);
