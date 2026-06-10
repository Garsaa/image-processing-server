import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  PUBLIC_BASE_URL: z.string().url().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().min(1).default("uploads"),
  DATA_DIR: z.string().min(1).default("data"),
  STORAGE_PROVIDER: z.enum(["local", "firebase", "supabase"]).default("local"),
  CAPTURES_REPOSITORY: z.enum(["json", "firestore", "supabase"]).default("json"),
  MAX_IMAGE_SIZE_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
  MOTION_DIFF_THRESHOLD: z.coerce.number().nonnegative().default(25),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_BUCKET: z.string().min(1).default("captures"),
  SUPABASE_CAPTURES_TABLE: z.string().min(1).default("captures"),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().optional(),
  FIREBASE_CAPTURES_COLLECTION: z.string().min(1).default("captures"),
  FIREBASE_SIGNED_URL_EXPIRES: z.string().min(1).default("2035-01-01"),
  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().int().positive().default(587),
  MAIL_SECURE: z
    .string()
    .transform((value) => value === "true")
    .default("false"),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM: z.string().optional(),
  ALERT_EMAIL_TO: z.string().email().default("gabriel.garcia.dev@gmail.com")
});

export const env = envSchema.parse(process.env);
