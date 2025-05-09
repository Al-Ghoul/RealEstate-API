import { encode } from "blurhash";
import sharp from "sharp";

export async function generateBlurHash(buffer: Buffer): Promise<string> {
  const image = sharp(buffer);

  const { data, info } = await image
    .ensureAlpha() // Ensure RGBA format
    .raw()
    .toBuffer({ resolveWithObject: true });

  return encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4, // componentsX
    3, // componentsY
  );
}
