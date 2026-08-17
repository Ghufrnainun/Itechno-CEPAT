/**
 * Utilitas untuk kompresi gambar di sisi klien (browser) menggunakan Canvas HTML5.
 * Mengurangi ukuran gambar besar secara drastis (hingga 80-90%) dan menjaga file yang sudah kecil tetap optimal.
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 s.d 1.0 (default 0.75)
  outputFormat?: 'image/jpeg' | 'image/webp';
}

export interface CompressImageResult {
  file: File;
  base64: string;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
  sizeReductionPercent: number;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<CompressImageResult> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.75,
    outputFormat = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      reject(new Error('File yang dipilih bukan merupakan gambar yang valid.'));
      return;
    }

    const originalSize = file.size;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const originalDataUrl = event.target?.result as string;
      const img = new Image();
      img.src = originalDataUrl;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Jika ukuran file sudah sangat kecil (< 80KB) dan dimensinya sudah <= maxWidth,
        // pertahankan file asli agar tidak terjadi overhead re-encoding
        if (originalSize < 80 * 1024 && width <= maxWidth && height <= maxHeight) {
          resolve({
            file: file,
            base64: originalDataUrl,
            previewUrl: URL.createObjectURL(file),
            originalSize,
            compressedSize: originalSize,
            sizeReductionPercent: 0,
          });
          return;
        }

        // Pertahankan aspect ratio jika dimensi melebihi batas maksimal
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal menginisialisasi canvas context.'));
          return;
        }

        // Latar belakang putih untuk gambar transparan (PNG to JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke format terkompresi
        const compressedBase64 = canvas.toDataURL(outputFormat, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal mengompresi gambar.'));
              return;
            }

            const compressedSize = blob.size;

            // ATURAN PENTING: Jika hasil re-encode Canvas malah lebih besar dari file asli,
            // SELALU gunakan file asli agar ukuran tidak pernah membengkak!
            if (compressedSize >= originalSize) {
              resolve({
                file: file,
                base64: originalDataUrl,
                previewUrl: URL.createObjectURL(file),
                originalSize,
                compressedSize: originalSize,
                sizeReductionPercent: 0,
              });
              return;
            }

            const ext = outputFormat === 'image/webp' ? 'webp' : 'jpg';
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, `_compressed.${ext}`),
              { type: outputFormat, lastModified: Date.now() }
            );

            const reduction = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            resolve({
              file: compressedFile,
              base64: compressedBase64,
              previewUrl: URL.createObjectURL(blob),
              originalSize,
              compressedSize,
              sizeReductionPercent: reduction,
            });
          },
          outputFormat,
          quality
        );
      };

      img.onerror = () => reject(new Error('Gagal memuat gambar untuk proses kompresi.'));
    };

    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
  });
}
