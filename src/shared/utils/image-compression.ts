const TARGET_WIDTH = 600;
const TARGET_HEIGHT = 800;
const QUALITY = 0.85;

export async function compressMemberPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const { width: originalWidth, height: originalHeight } = bitmap;

  let finalWidth = originalWidth;
  let finalHeight = originalHeight;
  let offsetX = 0;
  let offsetY = 0;
  let sourceWidth = originalWidth;
  let sourceHeight = originalHeight;

  const isTooLarge = originalWidth > TARGET_WIDTH || originalHeight > TARGET_HEIGHT;

  if (isTooLarge) {
    const targetAspect = TARGET_WIDTH / TARGET_HEIGHT;
    const originalAspect = originalWidth / originalHeight;

    if (originalAspect > targetAspect) {
      sourceHeight = originalHeight;
      sourceWidth = originalHeight * targetAspect;
      offsetX = (originalWidth - sourceWidth) / 2;
      offsetY = 0;
    } else {
      sourceWidth = originalWidth;
      sourceHeight = originalWidth / targetAspect;
      offsetX = 0;
      offsetY = (originalHeight - sourceHeight) / 2;
    }

    finalWidth = TARGET_WIDTH;
    finalHeight = TARGET_HEIGHT;
  }

  const canvas = document.createElement("canvas");
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Canvas context could not be created");

  ctx.drawImage(
    bitmap,
    offsetX,
    offsetY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    finalWidth,
    finalHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Image compression failed"));
      },
      "image/jpeg",
      QUALITY,
    );
  });
}
