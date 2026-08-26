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

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/40";

function formatOrder(value: number | null | undefined) {
  return String(Number(value ?? 0)).padStart(2, "0");
}

export default function PortfolioCategoryManager({
  categories,
  subcategories,
}: Props) {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const orderedCategories = useMemo(
    () =>
      [...categories].sort(
        (a, b) =>
          Number(a.position ?? 9999) - Number(b.position ?? 9999) ||
          a.name.localeCompare(b.name, "es")
      ),
    [categories]
  );

  const orderedSubcategories = useMemo(
    () =>
      [...subcategories].sort(
        (a, b) =>
          Number(a.position ?? 9999) - Number(b.position ?? 9999) ||
          a.name.localeCompare(b.name, "es")
      ),
    [subcategories]
  );

  const groupedSubcategories = useMemo(() => {
    return orderedCategories.map((category) => ({
      category,
      subcategories: orderedSubcategories.filter(
        (subcategory) => subcategory.category_id === category.id
      ),
    }));
  }, [orderedCategories, orderedSubcategories]);

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

    const form = event.currentTarget;
    const formData = new FormData(form);
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

    form.reset();
    setMessage("✅ Categoría creada correctamente.");
    setLoading(false);
    router.refresh();
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

    const form = event.currentTarget;
    const formData = new FormData(form);
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

    form.reset();
    setMessage("✅ Subcategoría creada correctamente.");
    setLoading(false);
    router.refresh();
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
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <details className="group rounded-[1.5rem] border border-white/10 bg-neutral-950">
          <summary className="cursor-pointer list-none p-5 [&::-webkit-details-marker]:hidden">
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              Crear
            </p>
            <div className="mt-2 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Nueva categoría</h2>
              <span className="text-white/35 transition group-open:rotate-180">
                ↓
              </span>
            </div>
          </summary>

          <form
            onSubmit={createCategory}
            className="space-y-4 border-t border-white/10 p-5"
          >
            <input
              name="name"
              required
              placeholder="Nombre. Ej: Eventos especiales"
              className={fieldClass}
            />

            <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
              <input
                name="slug"
                placeholder="Slug opcional"
                className={fieldClass}
              />

              <input
                name="position"
                type="number"
                placeholder="Orden"
                className={fieldClass}
              />
            </div>

            <textarea
              name="description"
              placeholder="Descripción opcional"
              rows={3}
              className={fieldClass}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:opacity-50"
            >
              Crear categoría
            </button>
          </form>
        </details>

        <details className="group rounded-[1.5rem] border border-white/10 bg-neutral-950">
          <summary className="cursor-pointer list-none p-5 [&::-webkit-details-marker]:hidden">
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              Crear
            </p>
            <div className="mt-2 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Nueva subcategoría</h2>
              <span className="text-white/35 transition group-open:rotate-180">
                ↓
              </span>
            </div>
          </summary>

          <form
            onSubmit={createSubcategory}
            className="space-y-4 border-t border-white/10 p-5"
          >
            <select
              name="category_id"
              required
              defaultValue=""
              className={fieldClass}
            >
              <option value="" disabled>
                Selecciona categoría principal
              </option>

              {orderedCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {formatOrder(category.position)} · {category.name}
                </option>
              ))}
            </select>

            <input
              name="name"
              required
              placeholder="Nombre. Ej: Bodas"
              className={fieldClass}
            />

            <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
              <input
                name="slug"
                placeholder="Slug opcional"
                className={fieldClass}
              />

              <input
                name="position"
                type="number"
                placeholder="Orden"
                className={fieldClass}
              />
            </div>

            <textarea
              name="description"
              placeholder="Descripción opcional"
              rows={3}
              className={fieldClass}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:opacity-50"
            >
              Crear subcategoría
            </button>
          </form>
        </details>
      </div>

      {message && (
        <p className="mt-4 rounded-2xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white/60">
          {message}
        </p>
      )}

      <div className="mt-8">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.25em] text-white/30">
            Organización
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            Estructura actual
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Las categorías y subcategorías se muestran según su número de orden. Abre únicamente la que necesites modificar.
          </p>
        </div>

        {groupedSubcategories.length > 0 ? (
          <div className="space-y-3">
            {groupedSubcategories.map(({ category, subcategories }) => (
              <details
                key={category.id}
                className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-neutral-950"
              >
                <summary className="grid cursor-pointer list-none gap-4 p-4 transition hover:bg-white/[0.025] sm:p-5 md:grid-cols-[70px_1fr_150px_110px_30px] md:items-center [&::-webkit-details-marker]:hidden">
                  <div>
                    <span className="inline-flex min-w-12 justify-center rounded-full border border-white/10 bg-black px-3 py-1.5 text-sm font-semibold text-white/70">
                      {formatOrder(category.position)}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{category.name}</h3>
                    <p className="mt-1 truncate text-xs text-white/35">
                      /{category.slug}
                    </p>
                  </div>

                  <div className="text-sm text-white/50">
                    {subcategories.length}{" "}
                    {subcategories.length === 1
                      ? "subcategoría"
                      : "subcategorías"}
                  </div>

                  <div>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs ${
                        category.is_active === false
                          ? "border-red-400/25 bg-red-400/10 text-red-300"
                          : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                      }`}
                    >
                      {category.is_active === false ? "Inactiva" : "Activa"}
                    </span>
                  </div>

                  <span className="text-white/35 transition group-open:rotate-180">
                    ↓
                  </span>
                </summary>

                <div className="border-t border-white/10 p-4 sm:p-5">
                  <form
                    onSubmit={(event) => updateCategory(event, category.id)}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr_1fr_110px]">
                      <input
                        name="name"
                        required
                        defaultValue={category.name}
                        className={fieldClass}
                      />

                      <input
                        name="slug"
                        required
                        defaultValue={category.slug}
                        className={fieldClass}
                      />

                      <input
                        name="position"
                        type="number"
                        defaultValue={category.position ?? 0}
                        className={fieldClass}
                        aria-label="Orden de categoría"
                      />
                    </div>

                    <textarea
                      name="description"
                      defaultValue={category.description ?? ""}
                      rows={2}
                      placeholder="Descripción"
                      className={`mt-3 ${fieldClass}`}
                    />

                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/75 transition hover:bg-white hover:text-black disabled:opacity-50"
                      >
                        Guardar categoría
                      </button>

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
                  </form>

                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/30">
                        Subcategorías
                      </p>
                      <span className="text-xs text-white/30">
                        Orden dentro de {category.name}
                      </span>
                    </div>

                    {subcategories.length > 0 ? (
                      <div className="mt-3 space-y-2">
                        {subcategories.map((subcategory) => (
                          <details
                            key={subcategory.id}
                            className="group/sub rounded-2xl border border-white/10 bg-black/40"
                          >
                            <summary className="grid cursor-pointer list-none gap-3 px-4 py-3 md:grid-cols-[60px_1fr_100px_30px] md:items-center [&::-webkit-details-marker]:hidden">
                              <span className="text-sm font-semibold text-white/55">
                                {formatOrder(subcategory.position)}
                              </span>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {subcategory.name}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-white/30">
                                  /{subcategory.slug}
                                </p>
                              </div>

                              <span
                                className={`w-fit rounded-full border px-2.5 py-1 text-[10px] ${
                                  subcategory.is_active === false
                                    ? "border-red-400/20 bg-red-400/10 text-red-300"
                                    : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                }`}
                              >
                                {subcategory.is_active === false
                                  ? "Inactiva"
                                  : "Activa"}
                              </span>

                              <span className="text-white/30 transition group-open/sub:rotate-180">
                                ↓
                              </span>
                            </summary>

                            <form
                              onSubmit={(event) =>
                                updateSubcategory(event, subcategory.id)
                              }
                              className="border-t border-white/10 p-4"
                            >
                              <div className="grid gap-3 md:grid-cols-[1fr_1fr_190px_110px]">
                                <input
                                  name="name"
                                  required
                                  defaultValue={subcategory.name}
                                  className={fieldClass}
                                />

                                <input
                                  name="slug"
                                  required
                                  defaultValue={subcategory.slug}
                                  className={fieldClass}
                                />

                                <select
                                  name="category_id"
                                  defaultValue={subcategory.category_id}
                                  className={fieldClass}
                                  aria-label="Categoría principal"
                                >
                                  {orderedCategories.map((parentCategory) => (
                                    <option
                                      key={parentCategory.id}
                                      value={parentCategory.id}
                                    >
                                      {formatOrder(parentCategory.position)} ·{" "}
                                      {parentCategory.name}
                                    </option>
                                  ))}
                                </select>

                                <input
                                  name="position"
                                  type="number"
                                  defaultValue={subcategory.position ?? 0}
                                  className={fieldClass}
                                  aria-label="Orden de subcategoría"
                                />
                              </div>

                              <textarea
                                name="description"
                                defaultValue={subcategory.description ?? ""}
                                rows={2}
                                placeholder="Descripción"
                                className={`mt-3 ${fieldClass}`}
                              />

                              <div className="mt-4 flex flex-wrap items-center gap-4">
                                <button
                                  type="submit"
                                  disabled={loading}
                                  className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/75 transition hover:bg-white hover:text-black disabled:opacity-50"
                                >
                                  Guardar subcategoría
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleSubcategory(subcategory)
                                  }
                                  className="text-sm text-white/50 transition hover:text-white"
                                >
                                  {subcategory.is_active === false
                                    ? "Activar"
                                    : "Desactivar"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteSubcategory(subcategory.id)
                                  }
                                  className="text-sm text-red-300 transition hover:text-red-200"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </form>
                          </details>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-white/35">
                        Esta categoría aún no tiene subcategorías.
                      </p>
                    )}
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-8 text-center text-white/45">
            Aún no hay categorías.
          </div>
        )}
      </div>
    </div>
  );
}
