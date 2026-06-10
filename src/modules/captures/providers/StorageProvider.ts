export type SaveImageInput = {
  id: string;
  deviceId: string;
  buffer: Buffer;
  mimeType: "image/jpeg";
};

export type SaveImageOutput = {
  imageUrl: string;
  imagePath: string;
};

export interface StorageProvider {
  saveImage(input: SaveImageInput): Promise<SaveImageOutput>;
  getImageBuffer(imagePath: string): Promise<Buffer>;
}
