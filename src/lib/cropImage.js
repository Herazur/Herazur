export default async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  opts = {}
) {
  if (!imageSrc) {
    throw new Error('imageSrc is required');
  }

  if (!pixelCrop || typeof pixelCrop !== 'object' || pixelCrop.width === 0 || pixelCrop.height === 0) {
    throw new Error('pixelCrop object with non-zero dimensions is required');
  }

  const {
    output = 'blob',
    mime = 'image/png',
    quality = 0.92,
  } = opts;

  const image = await createImage(imageSrc);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  const rotRad = (rotation * Math.PI) / 180;

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;
  
  if (mime === 'image/jpeg') {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // translate canvas context to a central location to allow rotating and scaling around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    throw new Error('Failed to get cropped canvas context');
  }

  // Set the size of the cropped canvas
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Draw the cropped image onto the new canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  if (output === 'base64') {
    return croppedCanvas.toDataURL(mime, quality);
  }

  // As a blob
  const blob = await canvasToBlob(croppedCanvas, mime, quality);
  if (!blob) throw new Error('toBlob failed');

  return blob;
}

const rotateSize = (width, height, rotation) => {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
};


function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((b) => resolve(b || null), mime, quality);
      return;
    }

    // Polyfill for browsers that don't support .toBlob
    try {
      const dataUrl = canvas.toDataURL(mime, quality);
      const parts = dataUrl.split(',');
      if (parts.length < 2) {
        resolve(null);
        return;
      }

      const bin = atob(parts[1]);
      const len = bin.length;
      const arr = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
        arr[i] = bin.charCodeAt(i);
      }

      resolve(new Blob([arr], { type: mime }));
    } catch (error) {
      console.error('Canvas to Blob polyfill error:', error);
      resolve(null);
    }
  });
}

function createImage(src) {
  return new Promise((resolve, reject) => {
    if (typeof Image === 'undefined') {
      reject(new Error('Image constructor not available'));
      return;
    }

    const img = new Image();

    if (typeof src === 'string' && /^https?:\/\//i.test(src)) {
      img.crossOrigin = 'anonymous';
    }

    const timeout = setTimeout(() => {
      reject(new Error('Image loading timeout'));
    }, 30000); // 30s timeout

    img.onload = () => {
      clearTimeout(timeout);
      if (img.naturalWidth && img.naturalHeight) {
        resolve(img);
      } else {
        reject(new Error('Image loaded but has invalid dimensions'));
      }
    };

    img.onerror = (error) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to load image: ${error || 'Unknown error'}`));
    };

    img.src = src;
  });
}

export function validateCropArea(pixelCrop, imageDimensions) {
  if (!pixelCrop || !imageDimensions) return false;

  return (
    pixelCrop.x >= 0 &&
    pixelCrop.y >= 0 &&
    pixelCrop.width > 0 &&
    pixelCrop.height > 0 &&
    pixelCrop.x + pixelCrop.width <= imageDimensions.width &&
    pixelCrop.y + pixelCrop.height <= imageDimensions.height
  );
}

export function getRecommendedCropSize(originalSize, targetAspectRatio) {
  const { width, height } = originalSize;
  const currentAspect = width / height;

  if (currentAspect > targetAspectRatio) {
    // Taller than needed
    const newWidth = height * targetAspectRatio;
    return {
      width: newWidth,
      height: height,
      x: (width - newWidth) / 2,
      y: 0
    };
  } else {
    // Wider than needed
    const newHeight = width / targetAspectRatio;
    return {
      width: width,
      height: newHeight,
      x: 0,
      y: (height - newHeight) / 2
    };
  }
}