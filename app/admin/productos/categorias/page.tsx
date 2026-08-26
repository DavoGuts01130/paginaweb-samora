import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

type ProductSubcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

const inputClass =
  "min-h-12 w-full rounded-[0.9rem] border border-white/10 bg-black px-4 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-white/40 md:text-sm";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function getAdminSupabase() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/");

  return supabase;
}

async function createCategoryAction(formData: FormData) {
  "use server";

  const supabase = await getAdminSupabase();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = parseNumber(formData.get("sort_order"), 0);

  if (!name) return;

  await supabase.from("product_categories").upsert(
    {
      name,
      slug: slugify(name),
      description: description || null,
      sort_order: sortOrder,
      is_active: formData.get("is_active") === "on",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "slug" }
  );

  revalidatePath("/admin/productos/categorias");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
}

async function createSubcategoryAction(formData: FormData) {
  "use server";

  const supabase = await getAdminSupabase();
  const categoryId = String(formData.get("category_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const sortOrder = parseNumber(formData.get("sort_order"), 0);

  if (!categoryId || !name) return;

  await supabase.from("product_subcategories").upsert(
    {
      category_id: categoryId,
      name,
      slug: slugify(name),
      description: description || null,
      sort_order: sortOrder,
      is_active: formData.get("is_active") === "on",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "category_id,slug" }
  );

  revalidatePath("/admin/productos/categorias");
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
}

export default async function ProductCategoriesPage() {
  const supabase = await getAdminSupabase();

  const [{ data: categories }, { data: subcategories }] = await Promise.all([
    supabase.from("product_categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("product_subcategories").select("*").order("sort_order", { ascending: true }),
  ]);

  const categoryList = (categories ?? []) as ProductCategory[];
  const subcategoryList = (subcategories ?? []) as ProductSubcategory[];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
          <Link
            href="/admin/productos"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Volver a productos
          </Link>

          <div className="mt-8">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Catálogo
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-6xl">
              Categorías
            </h1>
            <p className="mt-4 max-w-2xl text-white/55">
              Administra la estructura comercial de la tienda sin recargar la vista principal de productos.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                Nueva categoría
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Crear categoría
              </h2>

              <form action={createCategoryAction} className="mt-6 space-y-4">
                <AdminField label="Nombre">
                  <input
                    name="name"
                    placeholder="Ej: Marquetería"
                    className={inputClass}
                  />
                </AdminField>

                <AdminField label="Descripción breve">
                  <input
                    name="description"
                    placeholder="Marcos, retablos y productos decorativos..."
                    className={inputClass}
                  />
                </AdminField>

                <AdminField label="Orden">
                  <input
                    name="sort_order"
                    type="number"
                    defaultValue="0"
                    className={inputClass}
                  />
                </AdminField>

                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white/60">
                  <input name="is_active" type="checkbox" defaultChecked />
                  Categoría activa
                </label>

                <button
                  type="submit"
                  className="min-h-12 w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black"
                >
                  Crear categoría
                </button>
              </form>
            </section>

            <section className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                Nueva subcategoría
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Crear subcategoría
              </h2>

              <form action={createSubcategoryAction} className="mt-6 space-y-4">
                <AdminField label="Categoría">
                  <select name="category_id" className={inputClass} required>
                    <option value="">Seleccionar categoría</option>
                    {categoryList.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </AdminField>

                <AdminField label="Nombre">
                  <input
                    name="name"
                    placeholder="Ej: Marcos"
                    className={inputClass}
                  />
                </AdminField>

                <AdminField label="Descripción breve">
                  <input
                    name="description"
                    placeholder="Descripción de la subcategoría"
                    className={inputClass}
                  />
                </AdminField>

                <AdminField label="Orden">
                  <input
                    name="sort_order"
                    type="number"
                    defaultValue="0"
                    className={inputClass}
                  />
                </AdminField>

                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white/60">
                  <input name="is_active" type="checkbox" defaultChecked />
                  Subcategoría activa
                </label>

                <button
                  type="submit"
                  className="min-h-12 w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black"
                >
                  Crear subcategoría
                </button>
              </form>
            </section>
          </div>

          <section className="mt-8 rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5 sm:p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              Estructura actual
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Categorías y subcategorías
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {categoryList.map((category) => {
                const children = subcategoryList.filter(
                  (subcategory) => subcategory.category_id === category.id
                );

                return (
                  <div
                    key={category.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="mt-1 text-xs text-white/35">
                          /{category.slug}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] ${
                          category.is_active !== false
                            ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                            : "border-white/10 bg-white/[0.04] text-white/45"
                        }`}
                      >
                        {category.is_active !== false ? "Activa" : "Oculta"}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-white/45">
                      {category.description || "Sin descripción"}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {children.length > 0 ? (
                        children.map((subcategory) => (
                          <span
                            key={subcategory.id}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/55"
                          >
                            {subcategory.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-white/30">
                          Sin subcategorías
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

function AdminField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/35">
        {label}
      </span>
      {children}
    </label>
  );
}
