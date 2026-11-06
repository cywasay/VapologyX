// Photos are shrunk in the browser before they are uploaded, so the store never needs to be told about photo sizes.
// A phone photo of several MB becomes a WebP of roughly 100 to 250 KB, which keeps the free storage going much longer.
export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
// The largest file a person may pick. The upload itself is far smaller once it has been shrunk.
export const PHOTO_PICK_MAX_BYTES = 25 * 1024 * 1024;
// The most the storage bucket accepts for one file.
export const PHOTO_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

const LONG_SIDE = 1600;

async function draw(bitmap: ImageBitmap, width: number, height: number, type: string, quality: number, background?: string) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return null;
  // JPEG has no see-through areas, so they would turn black without a backdrop.
  if (background) {
    context.fillStyle = background;
    context.fillRect(0, 0, width, height);
  }
  context.drawImage(bitmap, 0, 0, width, height);
  return new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, quality));
}

// Scales a photo down to at most 1600 px on its long side and saves it as WebP (or JPEG where the browser can't make WebP).
// A photo that is already small and light is returned as it is.
export async function shrinkPhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, LONG_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    let blob = await draw(bitmap, width, height, "image/webp", 0.82);
    let extension = "webp";
    if (blob?.type !== "image/webp") {
      blob = await draw(bitmap, width, height, "image/jpeg", 0.86, "#ffffff");
      extension = "jpg";
    }
    if (!blob) throw new Error("The photo couldn't be shrunk.");
    if (scale === 1 && blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]*$/, "") || "photo";
    return new File([blob], `${name}.${extension}`, { type: blob.type });
  } finally {
    bitmap.close();
  }
}
