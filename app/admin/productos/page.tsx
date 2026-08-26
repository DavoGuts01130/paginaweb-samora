import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    status?: string;
    q?: string;
    categoria?: string;
    imagen?: string;
  }>;
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
  price_cop: number | null;
  stock: number | null;
  is_active: boolean | null;
  sort_order: number | null;
};

const LOW_STOCK_LIMIT = 5;

const inputClass =
  "min-h-12 w-full rounded-[0.9rem] border border-white/10 bg-black px-4 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-white/40 md:text-sm";

const statusOptions = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "ocultos", label: "Ocultos" },
  { value: "poco_stock", label: "Poco stock" },
  { value: "agotados", label: "Agotados" },
  { value: "stock_sano", label: "Stock suficiente" },
  { value: "con_variantes", label: "Con variantes" },
  { value: "sin_variantes", label: "Sin variantes" },
];

const imageOptions = [
  { value: "todas", label: "Todas" },
  { value: "con_imagen", label: "Con imagen" },
  { value: "sin_imagen", label: "Sin imagen" },
];

function formatCOP(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString("es-CO")}`;
}

function getProductName(product: Product) {
  return product.name ?? product.title ?? "Producto sin nombre";
}

function getProductVariants(productId: string, variants: ProductVariant[]) {
  return variants
    .filter((variant) => variant.product_id === productId)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
}

function getStockValue(product: Product, variants: ProductVariant[]) {
  const productVariants = getProductVariants(product.id, variants).filter(
    (variant) => variant.is_active !== false
  );

  if (product.has_variants && productVariants.length > 0) {
    return productVariants.reduce(
      (sum, variant) => sum + Math.max(Number(variant.stock ?? 0), 0),
      0
    );
  }

  return Math.max(Number(product.stock ?? 0), 0);
}

function getPriceLabel(product: Product, variants: ProductVariant[]) {
  const productVariants = getProductVariants(product.id, variants).filter(
    (variant) => variant.is_active !== false && Number(variant.price_cop ?? 0) > 0
  );

  if (product.has_variants && productVariants.length > 0) {
    const prices = productVariants.map((variant) => Number(variant.price_cop ?? 0));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatCOP(min) : `${formatCOP(min)} - ${formatCOP(max)}`;
  }

  return formatCOP(product.price);
}

function getInventoryMeta(stock: number) {
  if (stock <= 0) {
    return {
      label: "Agotado",
      className: "border-red-400/25 bg-red-400/10 text-red-200",
    };
  }

  if (stock <= LOW_STOCK_LIMIT) {
    return {
      label: "Poco stock",
      className: "border-yellow-400/25 bg-yellow-400/10 text-yellow-200",
    };
  }

  return {
    label: "Stock suficiente",
    className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  };
}

function getImageStyle(product: Product): CSSProperties {
  return {
    objectFit: product.image_fit === "contain" ? "contain" : "cover",
    objectPosition: `${Number(product.image_x ?? 50)}% ${Number(product.image_y ?? 50)}%`,
    transform: `scale(${Number(product.image_zoom ?? 1)})`,
  };
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

function filterProducts(
  products: Product[],
  variants: ProductVariant[],
  categoriesById: Map<string, ProductCategory>,
  subcategoriesById: Map<string, ProductSubcategory>,
  status: string,
  search: string,
  categorySlug: string,
  imageFilter: string
) {
  const normalizedSearch = search.trim().toLowerCase();

  return products.filter((product) => {
    const stock = getStockValue(product, variants);
    const active = product.is_active !== false;
    const category = product.category_id ? categoriesById.get(product.category_id) : null;
    const subcategory = product.subcategory_id
      ? subcategoriesById.get(product.subcategory_id)
      : null;

    const matchesStatus =
      status === "todos" ||
      (status === "activos" && active) ||
      (status === "ocultos" && !active) ||
      (status === "agotados" && stock <= 0) ||
      (status === "poco_stock" && stock > 0 && stock <= LOW_STOCK_LIMIT) ||
      (status === "stock_sano" && stock > LOW_STOCK_LIMIT) ||
      (status === "con_variantes" && product.has_variants) ||
      (status === "sin_variantes" && !product.has_variants);

    const matchesCategory = !categorySlug || category?.slug === categorySlug;

    const hasImage = Boolean(product.image_url?.trim());
    const matchesImage =
      imageFilter === "todas" ||
      (imageFilter === "con_imagen" && hasImage) ||
      (imageFilter === "sin_imagen" && !hasImage);

    const searchableText = [
      product.name,
      product.title,
      product.slug,
      product.description,
      category?.name,
      subcategory?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedSearch || searchableText.includes(normalizedSearch);

    return matchesStatus && matchesSearch && matchesCategory && matchesImage;
  });
}

export default async function AdminProductosPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedStatus = params.status ?? "todos";
  const searchQuery = params.q ?? "";
  const selectedCategory = params.categoria ?? "";
  const selectedImage = params.imagen ?? "todas";

  const supabase = await getAdminSupabase();

  const [{ data: products }, { data: categories }, { data: subcategories }, { data: variants }] =
    await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("product_categories").select("id, name, slug").order("sort_order", { ascending: true }),
      supabase.from("product_subcategories").select("id, category_id, name, slug").order("sort_order", { ascending: true }),
      supabase.from("product_variants").select("id, product_id, price_cop, stock, is_active, sort_order").order("sort_order", { ascending: true }),
    ]);

  const productList = (products ?? []) as Product[];
  const categoryList = (categories ?? []) as ProductCategory[];
  const subcategoryList = (subcategories ?? []) as ProductSubcategory[];
  const variantList = (variants ?? []) as ProductVariant[];

  const categoriesById = new Map(categoryList.map((category) => [category.id, category]));
  const subcategoriesById = new Map(
    subcategoryList.map((subcategory) => [subcategory.id, subcategory])
  );

  const filteredProducts = filterProducts(
    productList,
    variantList,
    categoriesById,
    subcategoriesById,
    selectedStatus,
    searchQuery,
    selectedCategory,
    selectedImage
  );

  const totalProducts = productList.length;
  const activeProducts = productList.filter((product) => product.is_active !== false).length;
  const hiddenProducts = productList.filter((product) => product.is_active === false).length;
  const lowStockProducts = productList.filter((product) => {
    const stock = getStockValue(product, variantList);
    return stock > 0 && stock <= LOW_STOCK_LIMIT;
  }).length;
  const outOfStockProducts = productList.filter(
    (product) => getStockValue(product, variantList) <= 0
  ).length;
  const withoutImageProducts = productList.filter(
    (product) => !product.image_url?.trim()
  ).length;

  const hasFilters =
    selectedStatus !== "todos" ||
    Boolean(searchQuery) ||
    Boolean(selectedCategory) ||
    selectedImage !== "todas";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
          <Link
            href="/admin"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Volver al panel
          </Link>

          <div className="mt-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/35">
                Administración
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-7xl">
                Productos
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
                Gestiona el catálogo desde una vista compacta y abre cada producto solo cuando necesites editarlo.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/productos/categorias"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:bg-white hover:text-black"
              >
                Categorías
              </Link>

              <Link
                href="/admin/productos/nuevo"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
              >
                + Crear producto
              </Link>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total" value={totalProducts} />
            <StatCard label="Activos" value={activeProducts} tone="green" />
            <StatCard label="Ocultos" value={hiddenProducts} />
            <StatCard label="Poco stock" value={lowStockProducts} tone="yellow" />
            <StatCard label="Agotados" value={outOfStockProducts} tone="red" />
            <StatCard label="Sin imagen" value={withoutImageProducts} tone="yellow" />
          </div>

          <div className="mt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                  Productos existentes
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Mostrando {filteredProducts.length} de {totalProducts} productos.
                </p>
              </div>

              {hasFilters && (
                <Link
                  href="/admin/productos"
                  className="inline-flex w-fit rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-300 transition hover:border-red-400/40"
                >
                  Limpiar filtros
                </Link>
              )}
            </div>

            <form className="premium-card mt-6 rounded-[1.5rem] p-4 sm:p-5">
              <div className="grid gap-4 lg:grid-cols-[1.3fr_170px_190px_160px_auto] lg:items-end">
                <AdminField label="Buscar producto">
                  <input
                    name="q"
                    defaultValue={searchQuery}
                    placeholder="Nombre, slug, categoría..."
                    className={inputClass}
                  />
                </AdminField>

                <AdminField label="Inventario">
                  <select
                    name="status"
                    defaultValue={selectedStatus}
                    className={inputClass}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </AdminField>

                <AdminField label="Categoría">
                  <select
                    name="categoria"
                    defaultValue={selectedCategory}
                    className={inputClass}
                  >
                    <option value="">Todas</option>
                    {categoryList.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </AdminField>

                <AdminField label="Imagen">
                  <select
                    name="imagen"
                    defaultValue={selectedImage}
                    className={inputClass}
                  >
                    {imageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </AdminField>

                <button
                  type="submit"
                  className="min-h-12 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                >
                  Filtrar
                </button>
              </div>
            </form>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-neutral-950">
              <div className="hidden grid-cols-[minmax(280px,1.5fr)_minmax(170px,0.8fr)_170px_95px_120px_90px] gap-4 border-b border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-white/30 xl:grid">
                <span>Producto</span>
                <span>Categoría</span>
                <span>Precio</span>
                <span>Stock</span>
                <span>Estado</span>
                <span className="text-right">Acción</span>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {filteredProducts.map((product) => {
                    const productName = getProductName(product);
                    const stock = getStockValue(product, variantList);
                    const inventory = getInventoryMeta(stock);
                    const category = product.category_id
                      ? categoriesById.get(product.category_id)
                      : null;
                    const subcategory = product.subcategory_id
                      ? subcategoriesById.get(product.subcategory_id)
                      : null;
                    const active = product.is_active !== false;

                    return (
                      <div
                        key={product.id}
                        className="group grid gap-4 px-4 py-4 transition hover:bg-white/[0.025] sm:px-5 xl:grid-cols-[minmax(280px,1.5fr)_minmax(170px,0.8fr)_170px_95px_120px_90px] xl:items-center"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          {product.image_url ? (
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black">
                              <img
                                src={product.image_url}
                                alt={productName}
                                className="h-full w-full"
                                style={getImageStyle(product)}
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black text-[10px] text-white/30">
                              Sin imagen
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-semibold tracking-[-0.02em]">
                                {productName}
                              </h3>

                              {product.has_variants && (
                                <Badge className="border-blue-400/20 bg-blue-400/10 text-blue-200">
                                  Variantes
                                </Badge>
                              )}
                            </div>

                            <p className="mt-1 truncate text-xs text-white/35">
                              {product.slug ?? "Sin slug"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-white/70">
                            {category?.name ?? "Sin categoría"}
                          </p>
                          <p className="mt-1 text-xs text-white/35">
                            {subcategory?.name ?? "Sin subcategoría"}
                          </p>
                        </div>

                        <div className="whitespace-nowrap text-sm font-semibold">
                          {getPriceLabel(product, variantList)}
                        </div>

                        <div>
                          <p className="font-semibold">{stock}</p>
                          <p className="mt-1 text-xs text-white/35">unidades</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge className={inventory.className}>
                            {inventory.label}
                          </Badge>

                          <Badge
                            className={
                              active
                                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                                : "border-white/15 bg-white/[0.05] text-white/55"
                            }
                          >
                            {active ? "Activo" : "Oculto"}
                          </Badge>
                        </div>

                        <div className="xl:text-right">
                          <Link
                            href={`/admin/productos/${product.id}/editar`}
                            className="inline-flex items-center text-sm text-white/55 transition hover:text-white"
                          >
                            Editar →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 text-center text-white/45">
                  No hay productos que coincidan con este filtro.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  tone = "white",
}: {
  label: string;
  value: number;
  tone?: "white" | "yellow" | "green" | "red";
}) {
  const toneClass =
    tone === "yellow"
      ? "text-yellow-400"
      : tone === "green"
      ? "text-green-400"
      : tone === "red"
      ? "text-red-300"
      : "text-white";

  return (
    <div className="premium-card rounded-[1.25rem] p-4 sm:rounded-[1.5rem] sm:p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className={`mt-3 text-2xl font-bold sm:text-3xl ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${className}`}
    >
      {children}
    </span>
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
