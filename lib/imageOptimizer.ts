export type ImageOptimizeOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: "image/webp" | "image/jpeg";
};

function getFileNameWithoutExtension(fileName: string) {
  return fileName.replace(/\.[^/.]+$/, "");
}

function slugifyFileName(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo cargar la imagen."));
    };

    image.src = objectUrl;
  });
}

export async function optimizeImageForWeb(
  file: File,
  options: ImageOptimizeOptions = {}
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo seleccionado no es una imagen.");
  }

  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    outputType = "image/webp",
  } = options;

  const image = await loadImageFromFile(file);

  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;

  if (!originalWidth || !originalHeight) {
    throw new Error("La imagen no tiene dimensiones válidas.");
  }

  const scale = Math.min(
    maxWidth / originalWidth,
    maxHeight / originalHeight,
    1
  );

  const targetWidth = Math.round(originalWidth * scale);
  const targetHeight = Math.round(originalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("No se pudo procesar la imagen.");
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputType, quality);
  });

  if (!blob) {
    throw new Error("No se pudo comprimir la imagen.");
  }

  const originalName = getFileNameWithoutExtension(file.name);
  const cleanName = slugifyFileName(originalName) || "imagen";
  const extension = outputType === "image/webp" ? "webp" : "jpg";

  return new File([blob], `${cleanName}.${extension}`, {
    type: blob.type || outputType,
    lastModified: Date.now(),
  });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;

  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}