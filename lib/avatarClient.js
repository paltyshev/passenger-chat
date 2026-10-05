// Клиентская подготовка аватара: центрированная обрезка в квадрат и сжатие в JPEG.
// Исходник с телефона (3–10 МБ) никуда не уходит — на сервер едет ~10 КБ.

const SIZE = 192;
const QUALITY = 0.82;
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

export async function fileToAvatarDataUrl(file) {
  if (!file || !file.type.startsWith('image/') || file.size > MAX_SOURCE_BYTES) {
    throw new Error('bad_image');
  }
  // современные браузеры применяют EXIF-ориентацию к <img> сами
  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // под прозрачные PNG
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE);
  return canvas.toDataURL('image/jpeg', QUALITY);
}

export const avatarUrl = (id, v) => (v ? `/api/avatar/${encodeURIComponent(id)}?v=${v}` : '');
