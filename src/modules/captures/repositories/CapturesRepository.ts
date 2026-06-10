import type { Capture, ListCapturesFilters, PaginatedCaptures } from "../capture.types.js";

export interface CapturesRepository {
  create(capture: Capture): Promise<Capture>;
  findById(id: string): Promise<Capture | null>;
  findLatestByDeviceId(deviceId: string): Promise<Capture | null>;
  list(filters: ListCapturesFilters): Promise<PaginatedCaptures>;
}
