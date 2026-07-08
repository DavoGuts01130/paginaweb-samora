"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatFileSize, optimizeImageForWeb } from "@/lib/imageOptimizer";

type Props = {
  projectId: string;
};

export default function UploadProjectImages({ projectId }: Props) {
  const supabase = createClient();

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage("");

    try {
      let totalOriginalSize = 0;
      let totalOptimizedSize = 0;

      for (const file of Array.from(files)) {
        totalOriginalSize += file.size;

        const optimizedFile = await optimizeImageForWeb(file, {
          maxWidth: 1600,
          maxHeight: 1600,
          quality: 0.82,
          outputType: "image/webp",
        });

        totalOptimizedSize += optimizedFile.size;

        const ext = optimizedFile.name.split(".").pop() || "webp";

        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;

        const filePath = `projects/${projectId}/gallery/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("portfolio")
          .upload(filePath, optimizedFile, {
            cacheControl: "31536000",
            upsert: false,
            contentType: optimizedFile.type,
          });

        if (uploadError) {
          setMessage(`Error subiendo imagen: ${uploadError.message}`);
          setUploading(false);
          return;
        }

        const { data } = supabase.storage
          .from("portfolio")
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from("portfolio_images")
          .insert({
            project_id: projectId,
            image_url: data.publicUrl,
            position: 0,
            image_fit: "cover",
            image_zoom: 1,
            image_x: 50,
            image_y: 50,
          });

        if (dbError) {
          setMessage(`Error guardando imagen: ${dbError.message}`);
          setUploading(false);
          return;
        }
      }

      setMessage(
        `Imágenes optimizadas y subidas correctamente. Peso original: ${formatFileSize(
          totalOriginalSize
        )} → Peso web: ${formatFileSize(totalOptimizedSize)}`
      );

      setUploading(false);
      window.location.reload();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido.";

      setMessage(`Error procesando imágenes: ${errorMessage}`);
      setUploading(false);
    }
  }

  return (
    <div className="mt-4">
      <label className="block cursor-pointer rounded-xl border border-dashed border-white/20 bg-black px-4 py-5 text-center text-sm text-white/60 transition hover:border-white/40 hover:text-white">
        {uploading ? "Optimizando y subiendo..." : "Subir imágenes optimizadas"}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
      </label>

      <p className="mt-2 text-xs text-white/35">
        Las imágenes se convierten automáticamente a formato web para reducir
        peso sin perder buena calidad visual.
      </p>

      {message && <p className="mt-3 text-sm text-white/50">{message}</p>}
    </div>
  );
}