import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../../../config/env.js";
import { ensureDir } from "../../../shared/utils/ensureDir.js";
import type { Capture, ListCapturesFilters, PaginatedCaptures } from "../capture.types.js";
import type { CapturesRepository } from "./CapturesRepository.js";

export class JsonCapturesRepository implements CapturesRepository {
  private readonly filePath = path.join(env.DATA_DIR, "captures.json");

  async create(capture: Capture): Promise<Capture> {
    const captures = await this.readAll();
    captures.push(capture);
    await this.writeAll(captures);
    return capture;
  }

  async findById(id: string): Promise<Capture | null> {
    const captures = await this.readAll();
    return captures.find((capture) => capture.id === id) ?? null;
  }

  async findLatestByDeviceId(deviceId: string): Promise<Capture | null> {
    const captures = await this.readAll();

    return captures
      .filter((capture) => capture.deviceId === deviceId)
      .sort((a, b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt))[0] ?? null;
  }

  async list(filters: ListCapturesFilters): Promise<PaginatedCaptures> {
    const captures = await this.readAll();

    const filtered = captures
      .filter((capture) => {
        if (filters.deviceId && capture.deviceId !== filters.deviceId) return false;
        if (
          typeof filters.motionDetected === "boolean" &&
          capture.motionDetected !== filters.motionDetected
        ) {
          return false;
        }
        if (filters.from && Date.parse(capture.capturedAt) < filters.from.getTime()) return false;
        if (filters.to && Date.parse(capture.capturedAt) > filters.to.getTime()) return false;
        return true;
      })
      .sort((a, b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt));

    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / filters.pageSize), 1);
    const start = (filters.page - 1) * filters.pageSize;

    return {
      data: filtered.slice(start, start + filters.pageSize),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages
      }
    };
  }

  private async readAll(): Promise<Capture[]> {
    try {
      const content = await readFile(this.filePath, "utf-8");
      return JSON.parse(content) as Capture[];
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return [];
      }

      throw error;
    }
  }

  private async writeAll(captures: Capture[]): Promise<void> {
    await ensureDir(env.DATA_DIR);
    await writeFile(this.filePath, JSON.stringify(captures, null, 2));
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
