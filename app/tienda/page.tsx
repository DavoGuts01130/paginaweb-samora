import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tienda de productos fotográficos",
  description:
    "Compra productos fotográficos, recuerdos impresos y piezas visuales diseñadas para conservar momentos especiales con una presentación elegante.",
  alternates: {
    canonical: "/tienda",
  },
  openGraph: {
    title: "Tienda | Samora Estudio",
    description:
      "Productos fotográficos y recuerdos impresos con presentación premium.",
    url: "/tienda",
    images: [
      {
        url: "/og-tienda.jpg",
        width: 1200,
        height: 630,
        alt: "Tienda Samora Estudio",
      },
    ],
  },
};

type Props = {
  searchParams: Promise<{
    categoria?: string;
    subcategoria?: string;
    q?: string;
    orden?: string;
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
  created_at: string | null;
};

type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number | null;
};

type ProductSubcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number | null;
};

type ProductVariant = {
  id: string;
  product_id: string;
  name: string | null;
  option_1_label: string | null;
  option_1_value: string | null;
  option_2_label: string | null;
  option_2_value: string | null;
  price_cop: number | null;
  stock: number | null;
  is_active: boolean | null;
};

type SortOption = "recomendado" | "precio_asc" | "precio_desc" | "nombre";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "recomendado", label: "Orden recomendado" },
  { value: "precio_asc", label: "Menor precio" },
  { value: "precio_desc", label: "Mayor precio" },
  { value: "nombre", label: "Nombre A-Z" },
];

function getImageStyle(product: Product): CSSProperties {
  return {
    objectFit: product.image_fit === "contain" ? "contain" : "cover",
    objectPosition: `${Number(product.image_x ?? 50)}% ${Number(
      product.image_y ?? 50
    )}%`,
    transform: `scale(${Number(product.image_zoom ?? 1)})`,
  };
}

function formatCOP(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString("es-CO")}`;
}

function getProductName(product: Product) {
  return product.name ?? product.title ?? "Producto sin nombre";
}

function getVariantsForProduct(productId: string, variants: ProductVariant[]) {
  return variants.filter(
    (variant) => variant.product_id === productId && variant.is_active !== false
  );
}

function getProductStock(product: Product, variants: ProductVariant[]) {
  const productVariants = getVariantsForProduct(product.id, variants);

  if (product.has_variants && productVariants.length > 0) {
    return productVariants.reduce(
      (sum, variant) => sum + Math.max(Number(variant.stock ?? 0), 0),
      0
    );
  }

  return Math.max(Number(product.stock ?? 0), 0);
}

function getProductPrices(product: Product, variants: ProductVariant[]) {
  const productVariants = getVariantsForProduct(product.id, variants).filter(
    (variant) => Number(variant.price_cop ?? 0) > 0
  );

  if (product.has_variants && productVariants.length > 0) {
    return productVariants.map((variant) => Number(variant.price_cop ?? 0));
  }

  return [Number(product.price ?? 0)].filter((price) => price > 0);
}

function getProductSortPrice(product: Product, variants: ProductVariant[]) {
  const prices = getProductPrices(product, variants);
  if (prices.length === 0) return 0;
  return Math.min(...prices);
}

function getPriceLabel(product: Product, variants: ProductVariant[]) {
  const productVariants = getVariantsForProduct(product.id, variants).filter(
    (variant) => Number(variant.price_cop ?? 0) > 0
  );

  if (product.has_variants && productVariants.length > 0) {
    const prices = productVariants.map((variant) => Number(variant.price_cop ?? 0));
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) return formatCOP(min);
    return `${formatCOP(min)} - ${formatCOP(max)}`;
  }

  return formatCOP(product.price);
}

function getStockMeta(stock: number) {
  if (stock <= 0) {
    return {
      label: "Agotado",
      color: "text-red-300",
      border: "border-red-400/20 bg-red-400/10",
    };
  }

  if (stock <= 5) {
    return {
      label: "Poco stock",
      color: "text-yellow-300",
      border: "border-yellow-400/20 bg-yellow-400/10",
    };
  }

  return {
    label: "Disponible",
    color: "text-emerald-300",
    border: "border-emerald-400/20 bg-emerald-400/10",
  };
}

function getFilteredProducts({
  products,
  categoriesById,
  subcategoriesById,
  selectedCategory,
  selectedSubcategory,
  search,
}: {
  products: Product[];
  categoriesById: Map<string, ProductCategory>;
  subcategoriesById: Map<string, ProductSubcategory>;
  selectedCategory: string;
  selectedSubcategory: string;
  search: string;
}) {
  const normalizedSearch = search.trim().toLowerCase();

  return products.filter((product) => {
    const category = product.category_id ? categoriesById.get(product.category_id) : null;
    const subcategory = product.subcategory_id ? subcategoriesById.get(product.subcategory_id) : null;

    const matchesCategory = !selectedCategory || category?.slug === selectedCategory;
    const matchesSubcategory = !selectedSubcategory || subcategory?.slug === selectedSubcategory;

    const searchable = [
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

    const matchesSearch = !normalizedSearch || searchable.includes(normalizedSearch);

    return matchesCategory && matchesSubcategory && matchesSearch;
  });
}

function sortProducts({
  products,
  categoriesById,
  subcategoriesById,
  variants,
  order,
}: {
  products: Product[];
  categoriesById: Map<string, ProductCategory>;
  subcategoriesById: Map<string, ProductSubcategory>;
  variants: ProductVariant[];
  order: SortOption;
}) {
  return [...products].sort((a, b) => {
    if (order === "precio_asc") {
      return getProductSortPrice(a, variants) - getProductSortPrice(b, variants);
    }

    if (order === "precio_desc") {
      return getProductSortPrice(b, variants) - getProductSortPrice(a, variants);
    }

    if (order === "nombre") {
      return getProductName(a).localeCompare(getProductName(b), "es");
    }

    const categoryA = a.category_id ? categoriesById.get(a.category_id) : null;
    const categoryB = b.category_id ? categoriesById.get(b.category_id) : null;
    const subcategoryA = a.subcategory_id ? subcategoriesById.get(a.subcategory_id) : null;
    const subcategoryB = b.subcategory_id ? subcategoriesById.get(b.subcategory_id) : null;

    const categoryOrderA = Number(categoryA?.sort_order ?? 999);
    const categoryOrderB = Number(categoryB?.sort_order ?? 999);
    if (categoryOrderA !== categoryOrderB) return categoryOrderA - categoryOrderB;

    const subcategoryOrderA = Number(subcategoryA?.sort_order ?? 999);
    const subcategoryOrderB = Number(subcategoryB?.sort_order ?? 999);
    if (subcategoryOrderA !== subcategoryOrderB) return subcategoryOrderA - subcategoryOrderB;

    return getProductName(a).localeCompare(getProductName(b), "es");
  });
}

function toSortOption(value: string | undefined): SortOption {
  if (value === "precio_asc" || value === "precio_desc" || value === "nombre") {
    return value;
  }

  return "recomendado";
}

function buildTiendaHref({
  categoria,
  subcategoria,
  q,
  orden,
}: {
  categoria?: string;
  subcategoria?: string;
  q?: string;
  orden?: string;
}) {
  const params = new URLSearchParams();
  if (categoria) params.set("categoria", categoria);
  if (subcategoria) params.set("subcategoria", subcategoria);
  if (q) params.set("q", q);
  if (orden && orden !== "recomendado") params.set("orden", orden);

  const query = params.toString();
  return query ? `/tienda?${query}` : "/tienda";
}

export default async function TiendaPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedCategory = params.categoria ?? "";
  const requestedSubcategory = params.subcategoria ?? "";
  const search = params.q ?? "";
  const selectedOrder = toSortOption(params.orden);

  const supabase = await createClient();

  const [{ data: products }, { data: categories }, { data: subcategories }, { data: variants }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("product_categories")
        .select("id, name, slug, description, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("product_subcategories")
        .select("id, category_id, name, slug, description, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("product_variants")
        .select("id, product_id, name, option_1_label, option_1_value, option_2_label, option_2_value, price_cop, stock, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

  const rawProductList = (products ?? []) as Product[];
  const categoryList = (categories ?? []) as ProductCategory[];
  const subcategoryList = (subcategories ?? []) as ProductSubcategory[];
  const variantList = (variants ?? []) as ProductVariant[];

  const categoriesById = new Map(categoryList.map((category) => [category.id, category]));
  const subcategoriesById = new Map(
    subcategoryList.map((subcategory) => [subcategory.id, subcategory])
  );

  // Para mantener la tienda pública ordenada, no mostramos productos activos sin categoría o sin subcategoría.
  // Esos productos siguen apareciendo en /admin/productos para clasificarlos antes de publicarlos.
  const productList = rawProductList.filter(
    (product) => product.category_id && product.subcategory_id
  );

  const selectedCategoryRecord = categoryList.find(
    (category) => category.slug === selectedCategory
  );

  const requestedSubcategoryRecord = subcategoryList.find(
    (subcategory) => subcategory.slug === requestedSubcategory
  );

  const selectedSubcategoryRecord =
    requestedSubcategoryRecord &&
    (!selectedCategoryRecord || requestedSubcategoryRecord.category_id === selectedCategoryRecord.id)
      ? requestedSubcategoryRecord
      : null;

  const selectedSubcategory = selectedSubcategoryRecord?.slug ?? "";

  const availableSubcategories = selectedCategoryRecord
    ? subcategoryList.filter((subcategory) => subcategory.category_id === selectedCategoryRecord.id)
    : subcategoryList;

  const filteredProducts = sortProducts({
    products: getFilteredProducts({
      products: productList,
      categoriesById,
      subcategoriesById,
      selectedCategory,
      selectedSubcategory,
      search,
    }),
    categoriesById,
    subcategoriesById,
    variants: variantList,
    order: selectedOrder,
  });

  const showCategorySections = !selectedCategory && !selectedSubcategory && !search.trim();
  const showSubcategorySections = !!selectedCategoryRecord && !selectedSubcategory && !search.trim();
  const activeFiltersCount = [selectedCategory, selectedSubcategory, search.trim(), selectedOrder !== "recomendado" ? selectedOrder : ""].filter(Boolean).length;

  const pageTitle = selectedSubcategoryRecord
    ? selectedSubcategoryRecord.name
    : selectedCategoryRecord
    ? selectedCategoryRecord.name
    : "Productos";

  const pageDescription = selectedSubcategoryRecord?.description
    ?? selectedCategoryRecord?.description
    ?? "Marcos, impresiones, álbumes, portarretratos y foto-books para conservar recuerdos con una presentación elegante.";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-16">
          <div className="animate-fade-up">
            <p className="text-sm uppercase tracking-[0.35em] text-white/30">
              Tienda
            </p>

            <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-7xl">
                  {pageTitle}
                </h1>

                <p className="mt-4 max-w-xl text-base leading-7 text-white/50 md:text-lg md:leading-8">
                  {pageDescription}
                </p>
              </div>

              <Link
                href="/carrito"
                className="inline-flex w-fit rounded-full border border-white/15 px-5 py-3 text-sm text-white/65 transition hover:bg-white hover:text-black"
              >
                Ver carrito →
              </Link>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 shadow-2xl shadow-black/30 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
                <Link
                  href={buildTiendaHref({ q: search, orden: selectedOrder })}
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                    !selectedCategory
                      ? "border-white bg-white text-black"
                      : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                  }`}
                >
                  Todo
                </Link>

                {categoryList.map((category) => (
                  <Link
                    key={category.id}
                    href={buildTiendaHref({ categoria: category.slug, q: search, orden: selectedOrder })}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                      selectedCategory === category.slug
                        ? "border-white bg-white text-black"
                        : "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>

              <details className="group relative">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/75 transition hover:border-white/35 hover:bg-white hover:text-black [&::-webkit-details-marker]:hidden">
                  <span>Filtros</span>
                  {activeFiltersCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-black group-hover:bg-black group-hover:text-white">
                      {activeFiltersCount}
                    </span>
                  )}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4 transition group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>

                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-40 w-[min(92vw,28rem)] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#080808] shadow-2xl shadow-black/70">
                  <form className="p-5">
                    {search && <input type="hidden" name="q" value={search} />}

                    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-white/30">
                          Filtros
                        </p>
                        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
                          Refinar tienda
                        </h2>
                      </div>

                      <Link
                        href="/tienda"
                        className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/45 transition hover:border-white/30 hover:text-white"
                      >
                        Limpiar
                      </Link>
                    </div>

                    <div className="mt-5 grid gap-4">
                      <FilterField label="Categoría">
                        <select
                          name="categoria"
                          defaultValue={selectedCategory}
                          className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-white/35"
                        >
                          <option value="">Todas las categorías</option>
                          {categoryList.map((category) => (
                            <option key={category.id} value={category.slug}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </FilterField>

                      <FilterField label="Tipo / subcategoría">
                        <select
                          name="subcategoria"
                          defaultValue={selectedSubcategory}
                          className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-white/35"
                        >
                          <option value="">Todos los tipos</option>
                          {availableSubcategories.map((subcategory) => {
                            const parentCategory = categoriesById.get(subcategory.category_id);
                            const label = selectedCategoryRecord
                              ? subcategory.name
                              : `${parentCategory?.name ?? "Categoría"} · ${subcategory.name}`;

                            return (
                              <option key={subcategory.id} value={subcategory.slug}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                      </FilterField>

                      <FilterField label="Ordenar por">
                        <select
                          name="orden"
                          defaultValue={selectedOrder}
                          className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-white/35"
                        >
                          {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </FilterField>
                    </div>

                    <button
                      type="submit"
                      className="mt-5 flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                    >
                      Aplicar filtros
                    </button>
                  </form>
                </div>
              </details>
            </div>

            <form className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-[1fr_auto]">
              {selectedCategory && <input type="hidden" name="categoria" value={selectedCategory} />}
              {selectedSubcategory && <input type="hidden" name="subcategoria" value={selectedSubcategory} />}
              {selectedOrder !== "recomendado" && <input type="hidden" name="orden" value={selectedOrder} />}
              <input
                name="q"
                defaultValue={search}
                placeholder="Buscar producto, marco, álbum, impresión..."
                className="min-h-12 rounded-full border border-white/10 bg-black px-5 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/35"
              />
              <button
                type="submit"
                className="min-h-12 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
              >
                Buscar
              </button>
            </form>

            {(selectedCategoryRecord || selectedSubcategoryRecord || search || selectedOrder !== "recomendado") && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-[0.22em] text-white/30">
                  Activo
                </span>

                {selectedCategoryRecord && <ActiveChip label={selectedCategoryRecord.name} />}
                {selectedSubcategoryRecord && <ActiveChip label={selectedSubcategoryRecord.name} />}
                {search && <ActiveChip label={`Búsqueda: ${search}`} />}
                {selectedOrder !== "recomendado" && (
                  <ActiveChip label={sortOptions.find((option) => option.value === selectedOrder)?.label ?? selectedOrder} />
                )}

                <Link
                  href="/tienda"
                  className="rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-xs text-red-300 transition hover:border-red-400/40"
                >
                  Limpiar filtros
                </Link>
              </div>
            )}
          </div>

          {filteredProducts.length > 0 ? (
            <>
              {showCategorySections ? (
                <div className="mt-10 space-y-12">
                  {categoryList.map((category) => {
                    const categoryProducts = filteredProducts.filter(
                      (product) => product.category_id === category.id
                    );

                    if (categoryProducts.length === 0) return null;

                    return (
                      <ProductSection
                        key={category.id}
                        title={category.name}
                        description={category.description}
                        href={buildTiendaHref({ categoria: category.slug, orden: selectedOrder })}
                        products={categoryProducts}
                        variantList={variantList}
                        categoriesById={categoriesById}
                        subcategoriesById={subcategoriesById}
                        compact
                      />
                    );
                  })}
                </div>
              ) : showSubcategorySections ? (
                <div className="mt-10 space-y-12">
                  {availableSubcategories.map((subcategory) => {
                    const subcategoryProducts = filteredProducts.filter(
                      (product) => product.subcategory_id === subcategory.id
                    );

                    if (subcategoryProducts.length === 0) return null;

                    return (
                      <ProductSection
                        key={subcategory.id}
                        title={subcategory.name}
                        description={subcategory.description}
                        href={buildTiendaHref({
                          categoria: selectedCategoryRecord?.slug,
                          subcategoria: subcategory.slug,
                          orden: selectedOrder,
                        })}
                        products={subcategoryProducts}
                        variantList={variantList}
                        categoriesById={categoriesById}
                        subcategoriesById={subcategoriesById}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="mt-10">
                  <div className="mb-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-[0.28em] text-white/30">
                        Resultados
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                        {filteredProducts.length} productos encontrados
                      </h2>
                    </div>
                  </div>

                  <ProductsGrid
                    products={filteredProducts}
                    variantList={variantList}
                    categoriesById={categoriesById}
                    subcategoriesById={subcategoriesById}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="premium-card mt-10 rounded-[1.5rem] p-8 text-center">
              <p className="text-lg font-semibold">
                No hay productos disponibles con estos filtros.
              </p>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">
                Ajusta la categoría, subcategoría o búsqueda para revisar el catálogo.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/35">
        {label}
      </span>
      {children}
    </label>
  );
}

function ActiveChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/55">
      {label}
    </span>
  );
}

function ProductSection({
  title,
  description,
  href,
  products,
  variantList,
  categoriesById,
  subcategoriesById,
  compact = false,
}: {
  title: string;
  description: string | null;
  href: string;
  products: Product[];
  variantList: ProductVariant[];
  categoriesById: Map<string, ProductCategory>;
  subcategoriesById: Map<string, ProductSubcategory>;
  compact?: boolean;
}) {
  const visibleProducts = compact ? products.slice(0, 6) : products;
  const hiddenCount = Math.max(products.length - visibleProducts.length, 0);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.025] p-4 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/30">
            {products.length} {products.length === 1 ? "producto" : "productos"}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-0.04em] md:text-4xl">
            {title}
          </h2>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              {description}
            </p>
          )}
        </div>

        <Link
          href={href}
          className="inline-flex w-fit rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/65 transition hover:bg-white hover:text-black"
        >
          {hiddenCount > 0 ? `Ver ${products.length} productos →` : "Ver sección →"}
        </Link>
      </div>

      <div className="mt-6">
        <ProductsGrid
          products={visibleProducts}
          variantList={variantList}
          categoriesById={categoriesById}
          subcategoriesById={subcategoriesById}
        />
      </div>
    </section>
  );
}

function ProductsGrid({
  products,
  variantList,
  categoriesById,
  subcategoriesById,
}: {
  products: Product[];
  variantList: ProductVariant[];
  categoriesById: Map<string, ProductCategory>;
  subcategoriesById: Map<string, ProductSubcategory>;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          variantList={variantList}
          categoriesById={categoriesById}
          subcategoriesById={subcategoriesById}
        />
      ))}
    </div>
  );
}

function ProductCard({
  product,
  variantList,
  categoriesById,
  subcategoriesById,
}: {
  product: Product;
  variantList: ProductVariant[];
  categoriesById: Map<string, ProductCategory>;
  subcategoriesById: Map<string, ProductSubcategory>;
}) {
  const stock = getProductStock(product, variantList);
  const stockMeta = getStockMeta(stock);
  const category = product.category_id ? categoriesById.get(product.category_id) : null;
  const subcategory = product.subcategory_id ? subcategoriesById.get(product.subcategory_id) : null;
  const productName = getProductName(product);

  const cardContent = (
    <article className="premium-card premium-card-hover group h-full overflow-hidden rounded-[1.5rem] transition duration-300 hover:-translate-y-0.5 hover:border-white/20">
      {product.image_url ? (
        <div className="flex h-64 items-center justify-center overflow-hidden bg-black sm:h-72">
          <img
            src={product.image_url}
            alt={productName}
            className="image-premium h-full w-full transition duration-500 group-hover:scale-[1.02]"
            style={getImageStyle(product)}
          />
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center bg-black text-sm text-white/35 sm:h-72">
          Sin imagen
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {category && (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/40">
              {category.name}
            </span>
          )}
          {subcategory && (
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/40">
              {subcategory.name}
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-xl font-semibold tracking-[-0.02em] transition group-hover:text-white">
            {productName}
          </h3>

          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${stockMeta.border} ${stockMeta.color}`}
          >
            {stockMeta.label}
          </span>
        </div>

        <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/50">
          {product.description}
        </p>

        <div className="mt-5 flex items-end justify-between gap-4">
          <span className="whitespace-nowrap text-xl font-bold tracking-[-0.02em] sm:text-2xl">
            {getPriceLabel(product, variantList)}
          </span>

          {product.slug ? (
            <span className="shrink-0 text-sm text-white/35 transition group-hover:text-white/70">
              Ver producto →
            </span>
          ) : stock <= 0 ? (
            <span className="shrink-0 rounded-full border border-red-400/20 px-4 py-2 text-sm text-red-400">
              No disponible
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );

  if (!product.slug) {
    return cardContent;
  }

  return (
    <Link
      href={`/tienda/${product.slug}`}
      aria-label={`Ver ${productName}`}
      className="block h-full cursor-pointer rounded-[1.5rem] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      {cardContent}
    </Link>
  );
}
