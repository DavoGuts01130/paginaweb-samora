import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Navbar from "@/components/Navbar";
import EditProductForm from "@/components/EditProductForm";
import DeleteProductButton from "@/components/DeleteProductButton";
import VariantPricingFields from "@/components/VariantPricingFields";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

type Product = {
  id: string;
  name: string | null;
  title: string | null;
  slug: string | null;
  description: string | null;
  price: number | null;
  image_url: string | null;
  stock: number | null;
  is_active: boolean | null;
  image_fit: string | null;
  image_zoom: number | null;
  image_x: number | null;
  image_y: number | null;
  category_id: string | null;
  subcategory_id: string | null;
  has_variants: boolean | null;
  supplier_base_cost_cop: number | null;
  markup_percent: number | null;
};

type ProductCategory = {
  id: string;
  name: string;
  slug: string;
};

type ProductSubcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
};

type ProductVariant = {
  id: string;
  product_id: string;
  name: string | null;
  sku: string | null;
  option_1_label: string | null;
  option_1_value: string | null;
  option_2_label: string | null;
  option_2_value: string | null;
  supplier_cost_cop: number | null;
  markup_percent: number | null;
  price_cop: number | null;
  stock: number | null;
  is_active: boolean | null;
  sort_order: number | null;
};

const inputClass =
  "min-h-12 w-full rounded-[0.9rem] border border-white/10 bg-black px-4 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-white/40 md:text-sm";

function parseMoney(value: FormDataEntryValue | null) {
  return Math.max(Number(String(value ?? "").replace(/\D/g, "")) || 0, 0);
}

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getSuggestedPrice(cost: number, markupPercent: number) {
  if (cost <= 0) return 0;
  return Math.ceil((cost * (1 + markupPercent / 100)) / 1000) * 1000;
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

async function updateProductCatalogAction(formData: FormData) {
  "use server";

  const supabase = await getAdminSupabase();
  const productId = String(formData.get("product_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const subcategoryId = String(formData.get("subcategory_id") ?? "");

  if (!productId) return;

  await supabase
    .from("products")
    .update({
      category_id: categoryId || null,
      subcategory_id: subcategoryId || null,
      has_variants: formData.get("has_variants") === "on",
      supplier_base_cost_cop:
        parseMoney(formData.get("supplier_base_cost_cop")) || null,
      markup_percent: parseNumber(formData.get("markup_percent"), 30),
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);

  revalidatePath(`/admin/productos/${productId}/editar`);
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
}

async function createVariantAction(formData: FormData) {
  "use server";

  const supabase = await getAdminSupabase();
  const productId = String(formData.get("product_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const cost = parseMoney(formData.get("supplier_cost_cop"));
  const markupPercent = Math.max(
    parseNumber(formData.get("markup_percent"), 30),
    0
  );
  const typedPrice = parseMoney(formData.get("price_cop"));
  const price = typedPrice || getSuggestedPrice(cost, markupPercent);
  const stock = Math.max(parseNumber(formData.get("stock"), 0), 0);

  if (!productId || !name || price <= 0) return;

  const { data: lastVariant } = await supabase
    .from("product_variants")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder = Number(lastVariant?.sort_order ?? -1) + 1;

  await supabase.from("product_variants").insert({
    product_id: productId,
    name,
    option_1_label: "Tamaño",
    option_1_value: name,
    supplier_cost_cop: cost || null,
    markup_percent: markupPercent,
    price_cop: price,
    stock,
    sort_order: nextSortOrder,
    is_active: true,
  });

  await supabase
    .from("products")
    .update({ has_variants: true, updated_at: new Date().toISOString() })
    .eq("id", productId);

  revalidatePath(`/admin/productos/${productId}/editar`);
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
}

async function updateVariantAction(formData: FormData) {
  "use server";

  const supabase = await getAdminSupabase();
  const productId = String(formData.get("product_id") ?? "");
  const variantId = String(formData.get("variant_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const cost = parseMoney(formData.get("supplier_cost_cop"));
  const markupPercent = Math.max(
    parseNumber(formData.get("markup_percent"), 30),
    0
  );
  const typedPrice = parseMoney(formData.get("price_cop"));
  const price = typedPrice || getSuggestedPrice(cost, markupPercent);
  const stock = Math.max(parseNumber(formData.get("stock"), 0), 0);

  if (!productId || !variantId || !name || price <= 0) return;

  await supabase
    .from("product_variants")
    .update({
      name,
      option_1_label: "Tamaño",
      option_1_value: name,
      supplier_cost_cop: cost || null,
      markup_percent: markupPercent,
      price_cop: price,
      stock,
      is_active: formData.get("is_active") === "on",
      updated_at: new Date().toISOString(),
    })
    .eq("id", variantId);

  revalidatePath(`/admin/productos/${productId}/editar`);
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
}

async function deleteVariantAction(formData: FormData) {
  "use server";

  const supabase = await getAdminSupabase();
  const productId = String(formData.get("product_id") ?? "");
  const variantId = String(formData.get("variant_id") ?? "");

  if (!productId || !variantId) return;

  await supabase.from("product_variants").delete().eq("id", variantId);

  revalidatePath(`/admin/productos/${productId}/editar`);
  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getAdminSupabase();

  const [
    { data: product, error },
    { data: categories },
    { data: subcategories },
    { data: variants },
  ] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase
      .from("product_categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_subcategories")
      .select("id, category_id, name, slug")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (error || !product) redirect("/admin/productos");

  const currentProduct = product as Product;
  const categoryList = (categories ?? []) as ProductCategory[];
  const subcategoryList = (subcategories ?? []) as ProductSubcategory[];
  const variantList = (variants ?? []) as ProductVariant[];

  const productName =
    currentProduct.name ?? currentProduct.title ?? "Producto sin nombre";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/admin/productos"
              className="text-sm text-white/50 transition hover:text-white"
            >
              ← Volver a productos
            </Link>

            {currentProduct.slug && (
              <Link
                href={`/tienda/${currentProduct.slug}`}
                className="text-sm text-white/50 transition hover:text-white"
              >
                Ver en tienda →
              </Link>
            )}
          </div>

          <div className="mt-8">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Administración
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-6xl">
              Editar producto
            </h1>
            <p className="mt-3 text-lg text-white/60">{productName}</p>
          </div>

          <div className="mt-10 grid gap-6">
            <section>
              <SectionHeader
                eyebrow="Información principal"
                title="Datos, imagen y visibilidad"
                description="Edita el contenido principal del producto y ajusta cómo se muestra su imagen."
              />
              <div className="mt-5">
                <EditProductForm product={currentProduct} />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5 sm:p-6">
              <SectionHeader
                eyebrow="Clasificación comercial"
                title="Categoría, margen y variantes"
                description="Organiza el producto dentro del catálogo y conserva la información comercial interna."
              />

              <form action={updateProductCatalogAction} className="mt-6">
                <input type="hidden" name="product_id" value={currentProduct.id} />

                <div className="grid gap-4 md:grid-cols-2">
                  <AdminField label="Categoría">
                    <select
                      name="category_id"
                      defaultValue={currentProduct.category_id ?? ""}
                      className={inputClass}
                    >
                      <option value="">Sin categoría</option>
                      {categoryList.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </AdminField>

                  <AdminField label="Subcategoría">
                    <select
                      name="subcategory_id"
                      defaultValue={currentProduct.subcategory_id ?? ""}
                      className={inputClass}
                    >
                      <option value="">Sin subcategoría</option>
                      {subcategoryList.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </AdminField>

                  <AdminField label="Costo base proveedor">
                    <input
                      name="supplier_base_cost_cop"
                      type="number"
                      min="0"
                      step="1000"
                      defaultValue={currentProduct.supplier_base_cost_cop ?? ""}
                      className={inputClass}
                    />
                  </AdminField>

                  <AdminField label="Margen %">
                    <input
                      name="markup_percent"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={currentProduct.markup_percent ?? 30}
                      className={inputClass}
                    />
                  </AdminField>
                </div>

                <label className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white/65">
                  <input
                    name="has_variants"
                    type="checkbox"
                    defaultChecked={Boolean(currentProduct.has_variants)}
                  />
                  Este producto maneja variantes / tamaños
                </label>

                <button
                  type="submit"
                  className="mt-5 min-h-12 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                >
                  Guardar clasificación
                </button>
              </form>
            </section>

            <section className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeader
                  eyebrow="Variantes"
                  title="Tamaños, precios y stock"
                  description="Cada variante solo necesita un nombre, costo de proveedor, precio de venta y stock."
                />

                <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/45">
                  {variantList.length} {variantList.length === 1 ? "variante" : "variantes"}
                </span>
              </div>

              {variantList.length > 0 && (
                <div className="mt-6 space-y-3">
                  {variantList.map((variant) => (
                    <details
                      key={variant.id}
                      className="group rounded-2xl border border-white/10 bg-black/40"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 [&::-webkit-details-marker]:hidden">
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {variant.name ?? variant.option_1_value ?? "Variante"}
                          </p>
                          <p className="mt-1 text-xs text-white/40">
                            ${Number(variant.price_cop ?? 0).toLocaleString("es-CO")} · Stock {Number(variant.stock ?? 0)}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] ${
                              variant.is_active !== false
                                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                                : "border-white/10 bg-white/[0.04] text-white/45"
                            }`}
                          >
                            {variant.is_active !== false ? "Activa" : "Oculta"}
                          </span>
                          <span className="text-sm text-white/40 transition group-open:rotate-180">
                            ↓
                          </span>
                        </div>
                      </summary>

                      <div className="border-t border-white/10 p-4">
                        <form
                          action={updateVariantAction}
                          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"
                        >
                          <input type="hidden" name="product_id" value={currentProduct.id} />
                          <input type="hidden" name="variant_id" value={variant.id} />

                          <AdminField label="Nombre / tamaño">
                            <input
                              name="name"
                              required
                              placeholder="Ej: 20x30"
                              defaultValue={variant.name ?? variant.option_1_value ?? ""}
                              className={inputClass}
                            />
                          </AdminField>

                          <VariantPricingFields
                            defaultCost={variant.supplier_cost_cop ?? 0}
                            defaultMarkup={variant.markup_percent ?? 30}
                            defaultPrice={variant.price_cop ?? 0}
                          />

                          <AdminField label="Stock">
                            <input
                              name="stock"
                              type="number"
                              min="0"
                              required
                              defaultValue={variant.stock ?? 0}
                              className={inputClass}
                            />
                          </AdminField>

                          <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white/60 sm:col-span-2 lg:col-span-5">
                            <input
                              name="is_active"
                              type="checkbox"
                              defaultChecked={variant.is_active !== false}
                            />
                            Mostrar esta variante en la tienda
                          </label>

                          <button
                            type="submit"
                            className="min-h-12 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.02] sm:col-span-2 lg:col-span-5"
                          >
                            Guardar variante
                          </button>
                        </form>

                        <form action={deleteVariantAction} className="mt-3">
                          <input type="hidden" name="product_id" value={currentProduct.id} />
                          <input type="hidden" name="variant_id" value={variant.id} />
                          <button
                            type="submit"
                            className="text-sm text-red-300 transition hover:text-red-200"
                          >
                            Eliminar variante
                          </button>
                        </form>
                      </div>
                    </details>
                  ))}
                </div>
              )}

              <details className="group mt-6 rounded-2xl border border-dashed border-white/15 bg-black/40">
                <summary className="cursor-pointer list-none px-4 py-4 text-sm font-medium text-white/70 transition hover:text-white [&::-webkit-details-marker]:hidden">
                  + Agregar nueva variante
                </summary>

                <form
                  action={createVariantAction}
                  className="grid gap-4 border-t border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-5"
                >
                  <input type="hidden" name="product_id" value={currentProduct.id} />

                  <AdminField label="Nombre / tamaño">
                    <input
                      name="name"
                      required
                      placeholder="Ej: 20x30"
                      className={inputClass}
                    />
                  </AdminField>

                  <VariantPricingFields
                    defaultCost={0}
                    defaultMarkup={30}
                    defaultPrice={0}
                  />

                  <AdminField label="Stock">
                    <input
                      name="stock"
                      type="number"
                      min="0"
                      required
                      defaultValue="0"
                      className={inputClass}
                    />
                  </AdminField>

                  <button
                    type="submit"
                    className="min-h-12 rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.02] sm:col-span-2 lg:col-span-5"
                  >
                    Agregar variante
                  </button>
                </form>
              </details>
            </section>

            <section className="rounded-[1.5rem] border border-red-400/15 bg-red-400/[0.035] p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-red-300/60">
                Zona de peligro
              </p>
              <h2 className="mt-2 text-xl font-semibold">Eliminar producto</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Esta acción elimina el producto. Úsala solo cuando estés seguro de que ya no debe formar parte del catálogo.
              </p>

              <div className="mt-4">
                <DeleteProductButton id={currentProduct.id} />
              </div>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-white/30">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
        {description}
      </p>
    </div>
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
