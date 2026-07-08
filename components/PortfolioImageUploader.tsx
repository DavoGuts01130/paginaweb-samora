"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatFileSize, optimizeImageForWeb } from "@/lib/imageOptimizer";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export default function PortfolioImageUploader({ value, onChange }: Props) {
  const supabase = createClient();

  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    try {
      const optimizedFile = await optimizeImageForWeb(file, {
        maxWidth: 2000,
        maxHeight: 1400,
        quality: 0.85,
        outputType: "image/webp",
      });

      const ext = optimizedFile.name.split(".").pop() || "webp";

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(filePath, optimizedFile, {
          cacheControl: "31536000",
          upsert: false,
          contentType: optimizedFile.type,
        });

      if (uploadError) {
        setMessage(`Error subiendo portada: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from("portfolio").getPublicUrl(filePath);

      onChange(data.publicUrl);

      setMessage(
        `Portada optimizada. Peso original: ${formatFileSize(
          file.size
        )} → Peso web: ${formatFileSize(optimizedFile.size)}`
      );

      setUploading(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido.";

      setMessage(`Error procesando portada: ${errorMessage}`);
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      {value && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
          <img
            src={value}
            alt="Portada del proyecto"
            className="h-48 w-full object-cover"
          />
        </div>
      )}

      <label className="block cursor-pointer rounded-xl border border-dashed border-white/20 bg-black px-4 py-5 text-center text-sm text-white/60 transition hover:border-white/40 hover:text-white">
        {uploading ? "Optimizando portada..." : "Subir portada optimizada"}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </label>

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="text-sm text-white/45 transition hover:text-white"
        >
          Quitar portada
        </button>
      )}

      <p className="text-xs text-white/35">
        Recomendado para portadas: imagen horizontal. El archivo se convierte a
        WebP automáticamente.
      </p>

      {message && <p className="text-sm text-white/50">{message}</p>}
    </div>
  );
}