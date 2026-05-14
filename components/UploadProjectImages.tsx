"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const filePath = `projects/${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio")
        .upload(filePath, file);

      if (uploadError) {
        setMessage(`Error subiendo imagen: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage
        .from("portfolio")
        .getPublicUrl(filePath);

     const { error: dbError } = await supabase.from("portfolio_images").insert({
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

    setMessage("Imágenes subidas correctamente.");
    setUploading(false);
    window.location.reload();
  }

  return (
    <div className="mt-4">
      <label className="block cursor-pointer rounded-xl border border-dashed border-white/20 bg-black px-4 py-5 text-center text-sm text-white/60 transition hover:border-white/40 hover:text-white">
        {uploading ? "Subiendo..." : "Subir imágenes"}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
      </label>

      {message && <p className="mt-3 text-sm text-white/50">{message}</p>}
    </div>
  );
}