"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ImageAdjustControls from "@/components/ImageAdjustControls";
import PortfolioImageUploader from "@/components/PortfolioImageUploader";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type CreateProjectFormProps = {
  categories: Category[];
};

export default function CreateProjectForm({ categories }: CreateProjectFormProps) {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [coverImage, setCoverImage] = useState("");
  const [imageFit, setImageFit] = useState("cover");
  const [imageZoom, setImageZoom] = useState(1);
  const [imageX, setImageX] = useState(50);
  const [imageY, setImageY] = useState(50);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);

    const title = String(formData.get("title") || "");
    const slug = slugify(title);

    const { error } = await supabase.from("portfolio_projects").insert({
      title,
      slug,
      description: String(formData.get("description") || ""),
      category_id: String(formData.get("category_id") || ""),
      year: String(formData.get("year") || ""),
      client: String(formData.get("client") || ""),
      cover_image: coverImage,
      image_fit: imageFit,
      image_zoom: imageZoom,
      image_x: imageX,
      image_y: imageY,
      is_featured: formData.get("is_featured") === "on",
      featured_order: Number(formData.get("featured_order") || 0),
      display_order: Number(formData.get("display_order") || 0),
    });

    if (error) {
      setMessage(`❌ Error: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Proyecto creado correctamente.");
    setLoading(false);
    window.location.reload();
  }

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-6">
      <h2 className="text-2xl font-semibold">Crear proyecto</h2>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          name="title"
          required
          placeholder="Título del proyecto"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <select
          name="category_id"
          required
          defaultValue=""
          aria-label="Selecciona categoría"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        >
          <option value="" disabled>
            Selecciona categoría
          </option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <textarea
          name="description"
          required
          placeholder="Descripción"
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <input
          name="client"
          placeholder="Cliente"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <input
          name="year"
          placeholder="Año"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="display_order"
            type="number"
            placeholder="Orden general"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
          />

          <input
            name="featured_order"
            type="number"
            placeholder="Orden destacado"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-white/60">
          <input name="is_featured" type="checkbox" className="h-4 w-4" />
          Mostrar como proyecto destacado
        </label>

        <PortfolioImageUploader value={coverImage} onChange={setCoverImage} />

        <ImageAdjustControls
          imageUrl={coverImage}
          imageFit={imageFit}
          imageZoom={imageZoom}
          imageX={imageX}
          imageY={imageY}
          onImageFitChange={setImageFit}
          onImageZoomChange={setImageZoom}
          onImageXChange={setImageX}
          onImageYChange={setImageY}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear proyecto"}
        </button>

        {message && (
          <p className="text-center text-sm text-white/60">{message}</p>
        )}
      </form>
    </div>
  );
}