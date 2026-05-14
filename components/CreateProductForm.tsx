"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ImageAdjustControls from "@/components/ImageAdjustControls";
import ProductImageUploader from "@/components/ProductImageUploader";

export default function CreateProductForm() {
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [imageUrl, setImageUrl] = useState("");
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
    const name = String(formData.get("name") || "");
    const slug = slugify(name);

    const { error } = await supabase.from("products").insert({
      title: name,
      name,
      slug,
      description: String(formData.get("description") || ""),
      price: Number(formData.get("price") || 0),
      image_url: imageUrl,
      stock: Number(formData.get("stock") || 0),
      is_active: formData.get("is_active") === "on",
      image_fit: imageFit,
      image_zoom: imageZoom,
      image_x: imageX,
      image_y: imageY,
    });

    if (error) {
      setMessage(`❌ Error: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Producto creado correctamente.");
    setLoading(false);

    event.currentTarget.reset();
    setImageUrl("");
    setImageFit("cover");
    setImageZoom(1);
    setImageX(50);
    setImageY(50);

    window.location.reload();
  }

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-6">
      <h2 className="text-2xl font-semibold">Crear producto</h2>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <input
          name="name"
          required
          placeholder="Nombre del producto"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <textarea
          name="description"
          placeholder="Descripción"
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <input
          name="price"
          type="number"
          min="0"
          placeholder="Precio"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <input
          name="stock"
          type="number"
          min="0"
          placeholder="Stock"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <ProductImageUploader value={imageUrl} onChange={setImageUrl} />

        <ImageAdjustControls
          imageUrl={imageUrl}
          imageFit={imageFit}
          imageZoom={imageZoom}
          imageX={imageX}
          imageY={imageY}
          onImageFitChange={setImageFit}
          onImageZoomChange={setImageZoom}
          onImageXChange={setImageX}
          onImageYChange={setImageY}
        />

        <label className="flex items-center gap-3 text-sm text-white/60">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked
            className="h-4 w-4"
          />
          Producto visible en tienda
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:opacity-50"
        >
          {loading ? "Creando..." : "Crear producto"}
        </button>

        {message && (
          <p className="text-center text-sm text-white/60">{message}</p>
        )}
      </form>
    </div>
  );
}