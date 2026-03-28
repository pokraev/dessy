const HEIC_TYPES = ['image/heic', 'image/heif'];
const MAX_DIMENSION = 768;
const JPEG_QUALITY = 0.6;

function isHeic(file: File): boolean {
  if (HEIC_TYPES.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return name.endsWith('.heic') || name.endsWith('.heif');
}

async function convertHeicToJpeg(file: File): Promise<Blob> {
  const heic2any = (await import('heic2any')).default;
  const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY });
  return Array.isArray(result) ? result[0] : result;
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/** Extract MIME type from a data URL, e.g. "data:image/png;base64,..." → "image/png" */
export function extractMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:([^;]+);/);
  return match?.[1] ?? 'image/jpeg';
}

/** Resize image to fit within MAX_DIMENSION, always returns JPEG data URL. */
function resizeImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      // Always convert to JPEG for consistent MIME type sent to AI providers
      const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => reject(new Error('Failed to load image for resize'));
    img.src = dataUrl;
  });
}

/**
 * Read an image file to a JPEG data URL, converting HEIC/HEIF and
 * resizing large images to keep the payload under ~1.5MB.
 */
export async function readImageFile(file: File): Promise<string> {
  let dataUrl: string;
  if (isHeic(file)) {
    const jpeg = await convertHeicToJpeg(file);
    dataUrl = await blobToDataURL(jpeg);
  } else {
    dataUrl = await blobToDataURL(file);
  }
  return resizeImage(dataUrl);
}
