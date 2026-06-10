import sharp from "sharp";

const RESIZE_SIZE = 64;

export class ImageComparisonService {
  async isJpeg(image: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(image).metadata();
      return metadata.format === "jpeg";
    } catch {
      return false;
    }
  }

  async compare(currentImage: Buffer, previousImage: Buffer): Promise<number> {
    const [currentPixels, previousPixels] = await Promise.all([
      this.normalize(currentImage),
      this.normalize(previousImage)
    ]);

    let totalDiff = 0;

    for (let index = 0; index < currentPixels.length; index += 1) {
      totalDiff += Math.abs(currentPixels[index] - previousPixels[index]);
    }

    return Number((totalDiff / currentPixels.length).toFixed(2));
  }

  private async normalize(image: Buffer): Promise<Buffer> {
    return sharp(image)
      .rotate()
      .resize(RESIZE_SIZE, RESIZE_SIZE, { fit: "cover" })
      .greyscale()
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: false });
  }
}
