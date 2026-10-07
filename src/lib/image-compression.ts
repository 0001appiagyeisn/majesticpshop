/**
 * Client-side image compression utility
 * Resizes and compresses photos into compact WebP/JPEG data URLs (~30-50KB)
 * Allows storing product photos directly in Firestore without needing paid Cloud Storage or external billing.
 */
export async function compressImageFile(file: File, maxWidth = 800, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not in a browser environment, return empty
    if (typeof window === "undefined" || !window.FileReader) {
      return reject(new Error("Image compression requires a browser environment"));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Scale down proportionally if larger than maxWidth
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxWidth) {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          // Try exporting to WebP first (best compression)
          let dataUrl = canvas.toDataURL("image/webp", quality);

          // If browser doesn't support WebP export (returns png), fallback to JPEG
          if (!dataUrl.startsWith("data:image/webp")) {
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }

          resolve(dataUrl);
        } catch (err) {
          console.warn("Canvas compression failed, falling back to original data URL", err);
          resolve(event.target?.result as string);
        }
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}
