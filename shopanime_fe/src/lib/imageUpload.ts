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

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Unable to encode image'));
      }
    }, type, quality);
  });
}

export async function fileToProductImageBlob(file: File) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file');
  }
  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Product image must be 8MB or smaller');
  }

  const image = await loadImage(file);
  const targetWidth = 720;
  const targetHeight = 1080;
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = targetWidth / targetHeight;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;

  if (sourceRatio > targetRatio) {
    sourceWidth = image.naturalHeight * targetRatio;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / targetRatio;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }

  const attempts = [
    { width: 720, height: 1080, quality: 0.82 },
    { width: 560, height: 840, quality: 0.74 },
    { width: 420, height: 630, quality: 0.66 },
  ];

  let smallest: Blob | null = null;
  for (const attempt of attempts) {
    const canvas = document.createElement('canvas');
    canvas.width = attempt.width;
    canvas.height = attempt.height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Unable to process image');
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, attempt.width, attempt.height);
    const blob = await canvasToBlob(canvas, 'image/webp', attempt.quality);
    smallest = blob;
    if (blob.size <= 220000) {
      return blob;
    }
  }

  if (!smallest) {
    throw new Error('Unable to process image');
  }
  return smallest;
}
