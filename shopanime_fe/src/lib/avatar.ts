import type { User } from './types';

const DEFAULT_AVATAR_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="128" fill="#111216"/>
  <circle cx="128" cy="92" r="46" fill="#e63946"/>
  <path d="M46 224c10-46 42-72 82-72s72 26 82 72" fill="#2e333d"/>
  <path d="M46 224c10-46 42-72 82-72s72 26 82 72" fill="none" stroke="#e63946" stroke-width="10"/>
</svg>
`.trim());

export const SYSTEM_AVATAR_URL = `data:image/svg+xml;charset=utf-8,${DEFAULT_AVATAR_SVG}`;

export function getAvatarUrl(avatarUrl?: string | null) {
  const value = avatarUrl?.trim();
  return value || SYSTEM_AVATAR_URL;
}

export function getUserAvatar(user?: Pick<User, 'avatar_url'> | null) {
  return getAvatarUrl(user?.avatar_url);
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read image'));
    };
    image.src = objectUrl;
  });
}

function canvasToDataUrl(canvas: HTMLCanvasElement, quality: number) {
  const webp = canvas.toDataURL('image/webp', quality);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
}

export async function fileToAvatarDataUrl(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Avatar image must be 5MB or smaller');
  }

  const image = await loadImage(file);
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
  const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);
  const attempts = [
    { size: 256, quality: 0.82 },
    { size: 192, quality: 0.74 },
    { size: 160, quality: 0.66 },
  ];

  let smallest = '';
  for (const attempt of attempts) {
    const canvas = document.createElement('canvas');
    canvas.width = attempt.size;
    canvas.height = attempt.size;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to process image');
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, attempt.size, attempt.size);
    const dataUrl = canvasToDataUrl(canvas, attempt.quality);
    smallest = dataUrl;
    if (dataUrl.length <= 60000) {
      return dataUrl;
    }
  }

  return smallest;
}
