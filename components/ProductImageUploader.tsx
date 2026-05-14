"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export default function ProductImageUploader({ value, onChange }: Props) {
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploading(true);
    setMessage("");

    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      setMessage(`❌ Error subiendo imagen: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage
      .from("product-images")
      .getPublicUrl(filePath);

    onChange(data.publicUrl);
    setMessage("✅ Imagen subida correctamente.");
    setUploading(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-5">
      <h3 className="text-lg font-semibold">Imagen del producto</h3>

      <p className="mt-2 text-sm text-white/45">
        Puedes subir una imagen desde tu equipo o pegar una URL externa como respaldo.
      </p>

      <div className="mt-5">
        <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/55 transition hover:border-white/40 hover:text-white">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />

          {uploading ? "Subiendo imagen..." : "Seleccionar imagen desde mi equipo"}
        </label>
      </div>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="O pega aquí una URL de imagen"
        className="mt-4 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-white/40"
      />

      {message && <p className="mt-3 text-sm text-white/55">{message}</p>}
    </div>
  );
}