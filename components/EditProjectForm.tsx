"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ImageAdjustControls from "@/components/ImageAdjustControls";
import PortfolioImageUploader from "@/components/PortfolioImageUploader";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  year: string | null;
  client: string | null;
  cover_image: string | null;
  image_fit?: string | null;
  image_zoom?: number | null;
  image_x?: number | null;
  image_y?: number | null;
  is_featured?: boolean | null;
  featured_order?: number | null;
  display_order?: number | null;
};

type Props = {
  project: Project;
  categories: Category[];
};

export default function EditProjectForm({ project, categories }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [coverImage, setCoverImage] = useState(project.cover_image ?? "");
  const [imageFit, setImageFit] = useState(project.image_fit ?? "cover");
  const [imageZoom, setImageZoom] = useState(Number(project.image_zoom ?? 1));
  const [imageX, setImageX] = useState(Number(project.image_x ?? 50));
  const [imageY, setImageY] = useState(Number(project.image_y ?? 50));

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

    const { error } = await supabase
      .from("portfolio_projects")
      .update({
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
      })
      .eq("id", project.id);

    if (error) {
      setMessage(`❌ Error: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Proyecto actualizado correctamente.");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="title"
          required
          defaultValue={project.title}
          placeholder="Título del proyecto"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <select
          name="category_id"
          required
          defaultValue={project.category_id ?? ""}
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
          defaultValue={project.description ?? ""}
          placeholder="Descripción"
          rows={5}
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <input
          name="client"
          defaultValue={project.client ?? ""}
          placeholder="Cliente"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <input
          name="year"
          defaultValue={project.year ?? ""}
          placeholder="Año"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <input
            name="display_order"
            type="number"
            defaultValue={project.display_order ?? 0}
            placeholder="Orden general"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
          />

          <input
            name="featured_order"
            type="number"
            defaultValue={project.featured_order ?? 0}
            placeholder="Orden destacado"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-white/60">
          <input
            name="is_featured"
            type="checkbox"
            defaultChecked={project.is_featured ?? false}
            className="h-4 w-4"
          />
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
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>

        {message && (
          <p className="text-center text-sm text-white/60">{message}</p>
        )}
      </form>
    </div>
  );
}