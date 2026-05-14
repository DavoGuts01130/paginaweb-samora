"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ImageAdjustControls from "@/components/ImageAdjustControls";
import ProductImageUploader from "@/components/ProductImageUploader";

type Product = {
  id: string;
  name: string | null;
  title?: string | null;
  slug: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
  stock: number | null;
  is_active: boolean | null;
  image_fit?: string | null;
  image_zoom?: number | null;
  image_x?: number | null;
  image_y?: number | null;
};

export default function EditProductForm({ product }: { product: Product }) {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [imageUrl, setImageUrl] = useState(product.image_url ?? "");
  const [imageFit, setImageFit] = useState(product.image_fit ?? "cover");
  const [imageZoom, setImageZoom] = useState(Number(product.image_zoom ?? 1));
  const [imageX, setImageX] = useState(Number(product.image_x ?? 50));
  const [imageY, setImageY] = useState(Number(product.image_y ?? 50));

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

    const { error } = await supabase
      .from("products")
      .update({
        title: name,
        name,
        slug,
        description: String(formData.get("description") || ""),
        price: Number(formData.get("price") || 0),
        stock: Number(formData.get("stock") || 0),
        image_url: imageUrl,
        is_active: formData.get("is_active") === "on",
        image_fit: imageFit,
        image_zoom: imageZoom,
        image_x: imageX,
        image_y: imageY,
      })
      .eq("id", product.id);

    if (error) {
      setMessage(`❌ Error: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Producto actualizado correctamente.");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          required
          defaultValue={product.name ?? product.title ?? ""}
          placeholder="Nombre del producto"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <textarea
          name="description"
          defaultValue={product.description ?? ""}
          placeholder="Descripción"
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <input
          name="price"
          type="number"
          min="0"
          defaultValue={product.price ?? 0}
          placeholder="Precio"
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
        />

        <input
          name="stock"
          type="number"
          min="0"
          defaultValue={product.stock ?? 0}
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
            defaultChecked={product.is_active ?? true}
            className="h-4 w-4"
          />
          Producto visible en tienda
        </label>

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