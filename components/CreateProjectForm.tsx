"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ImageAdjustControls from "@/components/ImageAdjustControls";
import PortfolioImageUploader from "@/components/PortfolioImageUploader";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
};

type CreateProjectFormProps = {
  categories: Category[];
  subcategories: Subcategory[];
};

export default function CreateProjectForm({
  categories,
  subcategories,
}: CreateProjectFormProps) {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");

  const [coverImage, setCoverImage] = useState("");
  const [imageFit, setImageFit] = useState("cover");
  const [imageZoom, setImageZoom] = useState(1);
  const [imageX, setImageX] = useState(50);
  const [imageY, setImageY] = useState(50);

  const filteredSubcategories = useMemo(() => {
    return subcategories.filter(
      (subcategory) => subcategory.category_id === selectedCategoryId
    );
  }, [subcategories, selectedCategoryId]);

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
    const title = String(formData.get("title") || "").trim();
    const slug = slugify(title);

    const { data, error } = await supabase
      .from("portfolio_projects")
      .insert({
        title,
        slug,
        description: String(formData.get("description") || ""),
        category_id: selectedCategoryId,
        subcategory_id: selectedSubcategoryId || null,
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
      .select("id")
      .single();

    if (error || !data) {
      setMessage(`❌ Error: ${error?.message ?? "No fue posible crear el proyecto."}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Proyecto creado correctamente. Abriendo edición...");
    router.push(`/admin/portafolio/${data.id}/editar`);
    router.refresh();
  }

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5 sm:p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/30">
            Información
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Datos del proyecto</h2>
        </div>

        <input
          name="title"
          required
          placeholder="Título del proyecto"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <div className="grid gap-4 md:grid-cols-2">
          <select
            name="category_id"
            required
            value={selectedCategoryId}
            onChange={(event) => {
              setSelectedCategoryId(event.target.value);
              setSelectedSubcategoryId("");
            }}
            aria-label="Selecciona categoría principal"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
          >
            <option value="" disabled>
              Selecciona categoría principal
            </option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            name="subcategory_id"
            value={selectedSubcategoryId}
            onChange={(event) => setSelectedSubcategoryId(event.target.value)}
            disabled={!selectedCategoryId || filteredSubcategories.length === 0}
            aria-label="Selecciona subcategoría"
            className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <option value="">
              {selectedCategoryId
                ? "Sin subcategoría / seleccionar después"
                : "Primero selecciona una categoría"}
            </option>

            {filteredSubcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>

        <textarea
          name="description"
          required
          placeholder="Descripción"
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <div className="grid gap-4 md:grid-cols-2">
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
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/30">
            Organización
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              name="display_order"
              type="number"
              defaultValue="0"
              placeholder="Orden general"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
            />

            <input
              name="featured_order"
              type="number"
              defaultValue="0"
              placeholder="Orden destacado"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
            />
          </div>

          <label className="mt-4 flex items-center gap-3 text-sm text-white/60">
            <input name="is_featured" type="checkbox" className="h-4 w-4" />
            Mostrar como proyecto destacado
          </label>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/30">
            Portada
          </p>

          <div className="mt-4">
            <PortfolioImageUploader value={coverImage} onChange={setCoverImage} />
          </div>
        </div>

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
          {loading ? "Creando..." : "Crear y continuar a la galería"}
        </button>

        {message && (
          <p className="text-center text-sm text-white/60">{message}</p>
        )}
      </form>
    </div>
  );
}
