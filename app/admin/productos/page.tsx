import type { CSSProperties } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import CreateProductForm from "@/components/CreateProductForm";
import DeleteProductButton from "@/components/DeleteProductButton";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    status?: string;
    q?: string;
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
};

const LOW_STOCK_LIMIT = 5;

const filterOptions = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "ocultos", label: "Ocultos" },
  { value: "poco_stock", label: "Poco stock" },
  { value: "agotados", label: "Agotados" },
  { value: "stock_sano", label: "Stock suficiente" },
];

function formatCOP(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString("es-CO")}`;
}

function getProductName(product: Product) {
  return product.name ?? product.title ?? "Producto sin nombre";
}

function getStockValue(product: Product) {
  return Math.max(Number(product.stock ?? 0), 0);
}

function getInventoryStatus(product: Product) {
  const stock = getStockValue(product);

  if (stock <= 0) {
    return {
      label: "Agotado",
      description: "No disponible para compra",
      className: "border-red-400/25 bg-red-400/10 text-red-200",
      cardClassName: "border-red-400/20",
    };
  }

  if (stock <= LOW_STOCK_LIMIT) {
    return {
      label: "Poco stock",
      description: `${stock} ${stock === 1 ? "unidad" : "unidades"} disponible${stock === 1 ? "" : "s"}`,
      className: "border-yellow-400/25 bg-yellow-400/10 text-yellow-200",
      cardClassName: "border-yellow-400/20",
    };
  }

  return {
    label: "Stock suficiente",
    description: `${stock} unidades disponibles`,
    className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    cardClassName: "border-white/10",
  };
}

function getImageStyle(product: Product): CSSProperties {
  return {
    objectFit: product.image_fit === "contain" ? "contain" : "cover",
    objectPosition: `${Number(product.image_x ?? 50)}% ${Number(product.image_y ?? 50)}%`,
    transform: `scale(${Number(product.image_zoom ?? 1)})`,
  };
}

function filterProducts(products: Product[], status: string, search: string) {
  const normalizedSearch = search.trim().toLowerCase();

  return products.filter((product) => {
    const stock = getStockValue(product);
    const active = product.is_active !== false;

    const matchesStatus =
      status === "todos" ||
      (status === "activos" && active) ||
      (status === "ocultos" && !active) ||
      (status === "agotados" && stock <= 0) ||
      (status === "poco_stock" && stock > 0 && stock <= LOW_STOCK_LIMIT) ||
      (status === "stock_sano" && stock > LOW_STOCK_LIMIT);

    const searchableText = [
      product.name,
      product.title,
      product.slug,
      product.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });
}

export default async function AdminProductosPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedStatus = params.status ?? "todos";
  const searchQuery = params.q ?? "";

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

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, title, slug, description, price, image_url, stock, is_active, image_fit, image_zoom, image_x, image_y"
    )
    .order("created_at", { ascending: false });

  const productList = (products ?? []) as Product[];
  const filteredProducts = filterProducts(productList, selectedStatus, searchQuery);

  const totalProducts = productList.length;
  const activeProducts = productList.filter((product) => product.is_active !== false).length;
  const hiddenProducts = productList.filter((product) => product.is_active === false).length;
  const lowStockProducts = productList.filter((product) => {
    const stock = getStockValue(product);
    return stock > 0 && stock <= LOW_STOCK_LIMIT;
  }).length;
  const outOfStockProducts = productList.filter((product) => getStockValue(product) <= 0).length;

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

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/35">
                Administración
              </p>

              <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-7xl">
                Productos
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
                Crea, edita y gestiona productos de la tienda de Samora. Revisa
                stock, disponibilidad, productos agotados y visibilidad del catálogo.
              </p>
            </div>

            <div className="premium-card rounded-[1.5rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                Alerta inventario
              </p>
              <p className="mt-2 text-2xl font-bold text-red-300 sm:text-3xl">
                {outOfStockProducts}
              </p>
              <p className="mt-1 text-xs text-white/40">productos agotados</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard label="Total" value={totalProducts} />
            <StatCard label="Activos" value={activeProducts} tone="green" />
            <StatCard label="Ocultos" value={hiddenProducts} />
            <StatCard label="Poco stock" value={lowStockProducts} tone="yellow" />
            <StatCard label="Agotados" value={outOfStockProducts} tone="red" />
          </div>

          <div className="mt-10 grid gap-10 lg:grid-cols-[0.86fr_1.14fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <CreateProductForm />
            </div>

            <div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                    Productos existentes
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Mostrando {filteredProducts.length} de {totalProducts} productos.
                  </p>
                </div>

                {(selectedStatus !== "todos" || searchQuery) && (
                  <Link
                    href="/admin/productos"
                    className="inline-flex w-fit rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-300 transition hover:border-red-400/40"
                  >
                    Limpiar filtros
                  </Link>
                )}
              </div>

              <form className="premium-card mt-6 rounded-[1.5rem] p-4 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto] lg:items-end">
                  <AdminField label="Buscar producto">
                    <input
                      name="q"
                      defaultValue={searchQuery}
                      placeholder="Nombre, slug o descripción"
                      className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-white/40 md:text-sm"
                    />
                  </AdminField>

                  <AdminField label="Filtro de inventario">
                    <select
                      name="status"
                      defaultValue={selectedStatus}
                      className="min-h-12 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-base text-white outline-none focus:border-white/40 md:text-sm"
                    >
                      {filterOptions.map((option) => (
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

              <div className="mt-6 space-y-4">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const productName = getProductName(product);
                    const stock = getStockValue(product);
                    const active = product.is_active !== false;
                    const inventoryStatus = getInventoryStatus(product);

                    return (
                      <article
                        key={product.id}
                        className={`rounded-[1.5rem] border bg-neutral-950 p-4 transition hover:border-white/20 sm:p-5 ${inventoryStatus.cardClassName}`}
                      >
                        <div className="grid gap-5 sm:grid-cols-[6rem_1fr]">
                          {product.image_url ? (
                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-black">
                              <img
                                src={product.image_url}
                                alt={productName}
                                className="h-full w-full"
                                style={getImageStyle(product)}
                              />
                            </div>
                          ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-white/10 bg-black text-xs text-white/30">
                              Sin imagen
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge
                                    className={
                                      active
                                        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                                        : "border-white/15 bg-white/[0.05] text-white/55"
                                    }
                                  >
                                    {active ? "Activo" : "Oculto"}
                                  </Badge>
                                  <Badge className={inventoryStatus.className}>
                                    {inventoryStatus.label}
                                  </Badge>
                                </div>

                                <h3 className="mt-3 break-words text-xl font-semibold tracking-[-0.02em]">
                                  {productName}
                                </h3>
                              </div>

                              <div className="shrink-0 sm:text-right">
                                <p className="text-xl font-bold">
                                  {formatCOP(product.price)}
                                </p>
                                <p className="mt-1 text-xs text-white/40">
                                  Stock: {stock}
                                </p>
                              </div>
                            </div>

                            <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/45">
                              {product.description || "Sin descripción"}
                            </p>

                            <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 p-3">
                              <p className="text-xs uppercase tracking-[0.22em] text-white/30">
                                Estado de inventario
                              </p>
                              <p className="mt-2 text-sm text-white/70">
                                {inventoryStatus.description}
                              </p>
                              {stock <= 0 && (
                                <p className="mt-1 text-xs leading-5 text-red-200/75">
                                  El producto aparece como agotado en tienda y no se puede comprar.
                                </p>
                              )}
                              {stock > 0 && stock <= LOW_STOCK_LIMIT && (
                                <p className="mt-1 text-xs leading-5 text-yellow-200/75">
                                  Revisa si se debe reponer inventario o pausar temporalmente el producto.
                                </p>
                              )}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-4">
                              {product.slug && (
                                <Link
                                  href={`/tienda/${product.slug}`}
                                  className="text-sm text-white/70 transition hover:text-white"
                                >
                                  Ver producto →
                                </Link>
                              )}

                              <Link
                                href={`/admin/productos/${product.id}/editar`}
                                className="text-sm text-white/70 transition hover:text-white"
                              >
                                Editar →
                              </Link>

                              <DeleteProductButton id={product.id} />
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="premium-card rounded-[1.5rem] p-8 text-center text-white/50 sm:p-10">
                    No hay productos que coincidan con este filtro.
                  </div>
                )}
              </div>
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
      <p className="text-xs uppercase tracking-[0.22em] text-white/35 sm:text-sm sm:tracking-[0.25em]">
        {label}
      </p>
      <p className={`mt-3 text-2xl font-bold sm:text-3xl ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function AdminField({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/35">
        {label}
      </span>
      {children}
    </label>
  );
}
