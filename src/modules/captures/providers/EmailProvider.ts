export type SendMotionAlertInput = {
  deviceId: string;
  capturedAt: string;
  diffScore: number;
  imageUrl: string;
};

export interface EmailProvider {
  sendMotionAlert(input: SendMotionAlertInput): Promise<boolean>;
}
