/**
 * Client-side high-speed image compression and optimization for AI Vision
 * Resizes large camera photos (e.g. 10MB 48MP) to lightweight, sharp images (~100KB)
 * ready for instant upload and fast Gemini OCR processing.
 */

export interface CompressionResult {
  base64: string;
  mimeType: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  originalSizeReadable: string;
  compressedSizeReadable: string;
  reductionPercentage: number;
  width: number;
  height: number;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export async function compressImageForAI(
  file: File | Blob,
  maxDimension = 1200,
  quality = 0.8
): Promise<CompressionResult> {
  const originalSizeBytes = file.size;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Scale down proportionally if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("לא ניתן היה לאתחל מעבד תמונה"));
        return;
      }

      // Fill with white background (in case of PNG transparency)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      // Draw image smoothly
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = "image/jpeg";
      const base64 = canvas.toDataURL(mimeType, quality);

      // Calculate approximate size in bytes from base64
      const stringLength = base64.length - "data:image/jpeg;base64,".length;
      const compressedSizeBytes = Math.round((stringLength * 3) / 4);

      const reductionPercentage = Math.max(
        0,
        Math.round(((originalSizeBytes - compressedSizeBytes) / originalSizeBytes) * 100)
      );

      resolve({
        base64,
        mimeType,
        originalSizeBytes,
        compressedSizeBytes,
        originalSizeReadable: formatBytes(originalSizeBytes),
        compressedSizeReadable: formatBytes(compressedSizeBytes),
        reductionPercentage,
        width,
        height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("טעינת התמונה נכשלה"));
    };

    img.src = objectUrl;
  });
}
