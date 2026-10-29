// Клиентская подготовка аватара: центрированная обрезка в квадрат и сжатие в JPEG.
// Исходник с телефона (3–10 МБ) никуда не уходит — на сервер едут две копии:
// маленькая для списка (~10 КБ) и большая для просмотра фото (~100 КБ).

const SIZE = 192;
const QUALITY = 0.82;
const LARGE_SIZE = 960;
const LARGE_QUALITY = 0.8;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('bad_image'));
    };
    img.src = url;
  });
}

function squareJpeg(img, size, quality) {
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  const out = Math.min(size, side); // маленькие исходники не растягиваем

  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // под прозрачные PNG
  ctx.fillRect(0, 0, out, out);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);
  return canvas.toDataURL('image/jpeg', quality);
}

// -> { small, large } — data URL'ы JPEG
export async function fileToAvatarDataUrls(file) {
  if (!file || !file.type.startsWith('image/') || file.size > MAX_SOURCE_BYTES) {
    throw new Error('bad_image');
  }
  // современные браузеры применяют EXIF-ориентацию к <img> сами
  const img = await loadImage(file);
  return {
    small: squareJpeg(img, SIZE, QUALITY),
    large: squareJpeg(img, LARGE_SIZE, LARGE_QUALITY),
  };
}

export const avatarUrl = (id, v) => (v ? `/api/avatar/${encodeURIComponent(id)}?v=${v}` : '');
export const avatarLargeUrl = (id, v) => (v ? `${avatarUrl(id, v)}&size=lg` : '');
