import { env } from "../../../config/env.js";
import { getSupabaseClient } from "../../../config/supabase.js";
import { AppError } from "../../../shared/errors/AppError.js";
import type { Capture, ListCapturesFilters, PaginatedCaptures } from "../capture.types.js";
import type { CapturesRepository } from "./CapturesRepository.js";

type SupabaseCaptureRow = {
  id: string;
  device_id: string;
  capture_source: string | null;
  image_url: string;
  image_path: string;
  size_bytes: number;
  mime_type: "image/jpeg";
  captured_at: string;
  trigger_command: string | null;
  diff_score: number | null;
  motion_detected: boolean;
  email_alert_sent: boolean;
};

export class SupabaseCapturesRepository implements CapturesRepository {
  async create(capture: Capture): Promise<Capture> {
    const { error } = await getSupabaseClient()
      .from(env.SUPABASE_CAPTURES_TABLE)
      .insert(toRow(capture));

    if (error) {
      throw new AppError("Failed to save capture metadata to Supabase", 500, error.message);
    }

    return capture;
  }

  async findById(id: string): Promise<Capture | null> {
    const { data, error } = await getSupabaseClient()
      .from(env.SUPABASE_CAPTURES_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle<SupabaseCaptureRow>();

    if (error) {
      throw new AppError("Failed to find capture in Supabase", 500, error.message);
    }

    return data ? fromRow(data) : null;
  }

  async findLatestByDeviceId(deviceId: string): Promise<Capture | null> {
    const { data, error } = await getSupabaseClient()
      .from(env.SUPABASE_CAPTURES_TABLE)
      .select("*")
      .eq("device_id", deviceId)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle<SupabaseCaptureRow>();

    if (error) {
      throw new AppError("Failed to find latest capture in Supabase", 500, error.message);
    }

    return data ? fromRow(data) : null;
  }

  async list(filters: ListCapturesFilters): Promise<PaginatedCaptures> {
    let query = getSupabaseClient()
      .from(env.SUPABASE_CAPTURES_TABLE)
      .select("*", { count: "exact" })
      .order("captured_at", { ascending: false });

    if (filters.deviceId) {
      query = query.eq("device_id", filters.deviceId);
    }

    if (typeof filters.motionDetected === "boolean") {
      query = query.eq("motion_detected", filters.motionDetected);
    }

    if (filters.from) {
      query = query.gte("captured_at", filters.from.toISOString());
    }

    if (filters.to) {
      query = query.lte("captured_at", filters.to.toISOString());
    }

    const start = (filters.page - 1) * filters.pageSize;
    const end = start + filters.pageSize - 1;
    const { data, error, count } = await query.range(start, end);

    if (error) {
      throw new AppError("Failed to list captures from Supabase", 500, error.message);
    }

    const total = count ?? 0;
    const totalPages = Math.max(Math.ceil(total / filters.pageSize), 1);

    return {
      data: ((data ?? []) as SupabaseCaptureRow[]).map(fromRow),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages
      }
    };
  }
}

function toRow(capture: Capture): SupabaseCaptureRow {
  return {
    id: capture.id,
    device_id: capture.deviceId,
    capture_source: capture.captureSource ?? null,
    image_url: capture.imageUrl,
    image_path: capture.imagePath,
    size_bytes: capture.sizeBytes,
    mime_type: capture.mimeType,
    captured_at: capture.capturedAt,
    trigger_command: capture.triggerCommand ?? null,
    diff_score: capture.diffScore ?? null,
    motion_detected: capture.motionDetected,
    email_alert_sent: capture.emailAlertSent
  };
}

function fromRow(row: SupabaseCaptureRow): Capture {
  return {
    id: row.id,
    deviceId: row.device_id,
    captureSource: row.capture_source ?? undefined,
    imageUrl: row.image_url,
    imagePath: row.image_path,
    sizeBytes: row.size_bytes,
    mimeType: row.mime_type,
    capturedAt: row.captured_at,
    triggerCommand: row.trigger_command ?? undefined,
    diffScore: row.diff_score ?? undefined,
    motionDetected: row.motion_detected,
    emailAlertSent: row.email_alert_sent
  };
}
