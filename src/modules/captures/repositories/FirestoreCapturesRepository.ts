import { env } from "../../../config/env.js";
import { getFirestore } from "../../../config/firebase.js";
import type { Capture, ListCapturesFilters, PaginatedCaptures } from "../capture.types.js";
import type { CapturesRepository } from "./CapturesRepository.js";

export class FirestoreCapturesRepository implements CapturesRepository {
  async create(capture: Capture): Promise<Capture> {
    await this.collection().doc(capture.id).set(capture);
    return capture;
  }

  async findById(id: string): Promise<Capture | null> {
    const snapshot = await this.collection().doc(id).get();

    if (!snapshot.exists) {
      return null;
    }

    return snapshot.data() as Capture;
  }

  async findLatestByDeviceId(deviceId: string): Promise<Capture | null> {
    const snapshot = await this.collection()
      .where("deviceId", "==", deviceId)
      .orderBy("capturedAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs[0].data() as Capture;
  }

  async list(filters: ListCapturesFilters): Promise<PaginatedCaptures> {
    const snapshot = await this.collection().orderBy("capturedAt", "desc").get();

    const captures = snapshot.docs.map((doc) => doc.data() as Capture);

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
      });

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

  private collection() {
    return getFirestore().collection(env.FIREBASE_CAPTURES_COLLECTION);
  }
}
