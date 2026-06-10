export type Capture = {
  id: string;
  deviceId: string;
  captureSource?: string;
  imageUrl: string;
  imagePath: string;
  sizeBytes: number;
  mimeType: "image/jpeg";
  capturedAt: string;
  triggerCommand?: string;
  diffScore?: number;
  motionDetected: boolean;
  emailAlertSent: boolean;
};

export type CreateCaptureInput = {
  image: Buffer;
  deviceId?: string;
  captureSource?: string;
  triggerCommand?: string;
};

export type ListCapturesFilters = {
  deviceId?: string;
  motionDetected?: boolean;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
};

export type PaginatedCaptures = {
  data: Capture[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
