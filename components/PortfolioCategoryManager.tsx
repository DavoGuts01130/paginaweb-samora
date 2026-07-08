"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number | null;
  is_active: boolean | null;
};

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number | null;
  is_active: boolean | null;
};

type Props = {
  categories: Category[];
  subcategories: Subcategory[];
};

export default function PortfolioCategoryManager({
  categories,
  subcategories,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const groupedSubcategories = useMemo(() => {
    return categories.map((category) => ({
      category,
      subcategories: subcategories.filter(
        (subcategory) => subcategory.category_id === category.id
      ),
    }));
  }, [categories, subcategories]);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  async function createCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const slugInput = String(formData.get("slug") || "").trim();

    if (!name) {
      setMessage("❌ Escribe un nombre para la categoría.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("portfolio_categories").insert({
      name,
      slug: slugInput ? slugify(slugInput) : slugify(name),
      description: String(formData.get("description") || "").trim() || null,
      position: Number(formData.get("position") || 0),
      is_active: true,
    });

    if (error) {
      setMessage(`❌ Error creando categoría: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Categoría creada correctamente.");
    setLoading(false);
    router.refresh();
    event.currentTarget.reset();
  }

  async function updateCategory(
    event: FormEvent<HTMLFormElement>,
    categoryId: string
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const slugInput = String(formData.get("slug") || "").trim();

    const { error } = await supabase
      .from("portfolio_categories")
      .update({
        name,
        slug: slugInput ? slugify(slugInput) : slugify(name),
        description: String(formData.get("description") || "").trim() || null,
        position: Number(formData.get("position") || 0),
      })
      .eq("id", categoryId);

    if (error) {
      setMessage(`❌ Error actualizando categoría: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Categoría actualizada.");
    setLoading(false);
    router.refresh();
  }

  async function toggleCategory(category: Category) {
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("portfolio_categories")
      .update({
        is_active: !(category.is_active ?? true),
      })
      .eq("id", category.id);

    if (error) {
      setMessage(`❌ Error cambiando estado: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Estado actualizado.");
    setLoading(false);
    router.refresh();
  }

  async function deleteCategory(categoryId: string) {
    const confirmed = confirm(
      "¿Eliminar esta categoría definitivamente? Es mejor desactivarla si ya tiene proyectos asociados."
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("portfolio_categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      setMessage(`❌ Error eliminando categoría: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Categoría eliminada.");
    setLoading(false);
    router.refresh();
  }

  async function createSubcategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const categoryId = String(formData.get("category_id") || "");
    const name = String(formData.get("name") || "").trim();
    const slugInput = String(formData.get("slug") || "").trim();

    if (!categoryId || !name) {
      setMessage("❌ Selecciona categoría y escribe nombre de subcategoría.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("portfolio_subcategories").insert({
      category_id: categoryId,
      name,
      slug: slugInput ? slugify(slugInput) : slugify(name),
      description: String(formData.get("description") || "").trim() || null,
      position: Number(formData.get("position") || 0),
      is_active: true,
    });

    if (error) {
      setMessage(`❌ Error creando subcategoría: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Subcategoría creada correctamente.");
    setLoading(false);
    router.refresh();
    event.currentTarget.reset();
  }

  async function updateSubcategory(
    event: FormEvent<HTMLFormElement>,
    subcategoryId: string
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "").trim();
    const slugInput = String(formData.get("slug") || "").trim();

    const { error } = await supabase
      .from("portfolio_subcategories")
      .update({
        category_id: String(formData.get("category_id") || ""),
        name,
        slug: slugInput ? slugify(slugInput) : slugify(name),
        description: String(formData.get("description") || "").trim() || null,
        position: Number(formData.get("position") || 0),
      })
      .eq("id", subcategoryId);

    if (error) {
      setMessage(`❌ Error actualizando subcategoría: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Subcategoría actualizada.");
    setLoading(false);
    router.refresh();
  }

  async function toggleSubcategory(subcategory: Subcategory) {
    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("portfolio_subcategories")
      .update({
        is_active: !(subcategory.is_active ?? true),
      })
      .eq("id", subcategory.id);

    if (error) {
      setMessage(`❌ Error cambiando estado: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Estado actualizado.");
    setLoading(false);
    router.refresh();
  }

  async function deleteSubcategory(subcategoryId: string) {
    const confirmed = confirm(
      "¿Eliminar esta subcategoría definitivamente? Los proyectos asociados quedarán sin subcategoría."
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase
      .from("portfolio_subcategories")
      .delete()
      .eq("id", subcategoryId);

    if (error) {
      setMessage(`❌ Error eliminando subcategoría: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Subcategoría eliminada.");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="space-y-6">
        <div className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-6">
          <h2 className="text-2xl font-semibold">Crear categoría</h2>

          <form onSubmit={createCategory} className="mt-6 space-y-4">
            <input
              name="name"
              required
              placeholder="Nombre. Ej: Eventos especiales"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
            />

            <input
              name="slug"
              placeholder="Slug opcional. Ej: eventos-especiales"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
            />

            <textarea
              name="description"
              placeholder="Descripción opcional"
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
            />

            <input
              name="position"
              type="number"
              placeholder="Orden"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:opacity-50"
            >
              Crear categoría
            </button>
          </form>
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-6">
          <h2 className="text-2xl font-semibold">Crear subcategoría</h2>

          <form onSubmit={createSubcategory} className="mt-6 space-y-4">
            <select
              name="category_id"
              required
              defaultValue=""
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

            <input
              name="name"
              required
              placeholder="Nombre. Ej: Bodas"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
            />

            <input
              name="slug"
              placeholder="Slug opcional. Ej: bodas"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
            />

            <textarea
              name="description"
              placeholder="Descripción opcional"
              rows={3}
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
            />

            <input
              name="position"
              type="number"
              placeholder="Orden"
              className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:opacity-50"
            >
              Crear subcategoría
            </button>
          </form>
        </div>

        {message && (
          <p className="rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white/60">
            {message}
          </p>
        )}
      </div>

      <div className="space-y-5">
        <h2 className="text-2xl font-semibold">Categorías actuales</h2>

        {groupedSubcategories.length > 0 ? (
          groupedSubcategories.map(({ category, subcategories }) => (
            <div
              key={category.id}
              className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5"
            >
              <form
                onSubmit={(event) => updateCategory(event, category.id)}
                className="space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs ${
                      category.is_active === false
                        ? "border-red-400/30 bg-red-400/10 text-red-300"
                        : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    }`}
                  >
                    {category.is_active === false ? "Inactiva" : "Activa"}
                  </span>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      className="text-sm text-white/50 transition hover:text-white"
                    >
                      {category.is_active === false ? "Activar" : "Desactivar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteCategory(category.id)}
                      className="text-sm text-red-300 transition hover:text-red-200"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_1fr_100px]">
                  <input
                    name="name"
                    required
                    defaultValue={category.name}
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
                  />

                  <input
                    name="slug"
                    required
                    defaultValue={category.slug}
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
                  />

                  <input
                    name="position"
                    type="number"
                    defaultValue={category.position ?? 0}
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
                  />
                </div>

                <textarea
                  name="description"
                  defaultValue={category.description ?? ""}
                  rows={2}
                  placeholder="Descripción"
                  className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-white/40"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full border border-white/15 px-5 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
                >
                  Guardar categoría
                </button>
              </form>

              <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
                <p className="text-xs uppercase tracking-[0.25em] text-white/35">
                  Subcategorías
                </p>

                {subcategories.length > 0 ? (
                  subcategories.map((subcategory) => (
                    <form
                      key={subcategory.id}
                      onSubmit={(event) =>
                        updateSubcategory(event, subcategory.id)
                      }
                      className="rounded-2xl border border-white/10 bg-black p-4"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs ${
                            subcategory.is_active === false
                              ? "border-red-400/30 bg-red-400/10 text-red-300"
                              : "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                          }`}
                        >
                          {subcategory.is_active === false
                            ? "Inactiva"
                            : "Activa"}
                        </span>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => toggleSubcategory(subcategory)}
                            className="text-sm text-white/50 transition hover:text-white"
                          >
                            {subcategory.is_active === false
                              ? "Activar"
                              : "Desactivar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteSubcategory(subcategory.id)}
                            className="text-sm text-red-300 transition hover:text-red-200"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>

                      <input
                        type="hidden"
                        name="category_id"
                        value={subcategory.category_id}
                      />

                      <div className="grid gap-3 md:grid-cols-[1fr_1fr_100px]">
                        <input
                          name="name"
                          required
                          defaultValue={subcategory.name}
                          className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-white/40"
                        />

                        <input
                          name="slug"
                          required
                          defaultValue={subcategory.slug}
                          className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-white/40"
                        />

                        <input
                          name="position"
                          type="number"
                          defaultValue={subcategory.position ?? 0}
                          className="w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-white/40"
                        />
                      </div>

                      <textarea
                        name="description"
                        defaultValue={subcategory.description ?? ""}
                        rows={2}
                        placeholder="Descripción"
                        className="mt-3 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-white outline-none focus:border-white/40"
                      />

                      <button
                        type="submit"
                        disabled={loading}
                        className="mt-3 rounded-full border border-white/15 px-5 py-2 text-sm text-white/70 transition hover:border-white/40 hover:text-white disabled:opacity-50"
                      >
                        Guardar subcategoría
                      </button>
                    </form>
                  ))
                ) : (
                  <p className="text-sm text-white/40">
                    Esta categoría aún no tiene subcategorías.
                  </p>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-white/45">Aún no hay categorías.</p>
        )}
      </div>
    </div>
  );
}