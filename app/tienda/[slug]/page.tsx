import type { CSSProperties } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AddToCartButton from "@/components/AddToCartButton";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  stock: number | null;
  image_fit: string | null;
  image_zoom: number | null;
  image_x: number | null;
  image_y: number | null;
  category_id: string | null;
  subcategory_id: string | null;
  has_variants: boolean | null;
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
  price_cop: number | null;
  stock: number | null;
  is_active: boolean | null;
};

type ProductCategory = {
  id: string;
  name: string;
  slug: string;
};

type ProductSubcategory = {
  id: string;
  name: string;
  slug: string;
};

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

function getStockFromProduct(product: Product, variants: ProductVariant[]) {
  if (product.has_variants && variants.length > 0) {
    return variants.reduce((sum, variant) => sum + Math.max(Number(variant.stock ?? 0), 0), 0);
  }

  return Math.max(Number(product.stock ?? 0), 0);
}

function getPriceLabel(product: Product, variants: ProductVariant[]) {
  const variantPrices = variants
    .map((variant) => Number(variant.price_cop ?? 0))
    .filter((price) => price > 0);

  if (product.has_variants && variantPrices.length > 0) {
    const min = Math.min(...variantPrices);
    const max = Math.max(...variantPrices);
    return min === max ? formatCOP(min) : `${formatCOP(min)} - ${formatCOP(max)}`;
  }

  return formatCOP(product.price);
}

function getWhatsappMessage(product: Product, productUrl: string) {
  return encodeURIComponent(
    `Hola, vi este producto en la tienda de Samora Estudio:\n\n📸 ${product.name}\n🔗 ${productUrl}\n\nQuisiera más información.`
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-black pt-24 text-white">
          <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
            <Link
              href="/tienda"
              className="text-sm text-white/50 transition hover:text-white"
            >
              ← Volver a tienda
            </Link>

            <div className="premium-card mt-8 rounded-[1.5rem] p-8">
              <h1 className="text-4xl font-bold">Producto no encontrado</h1>

              <p className="mt-4 max-w-xl text-white/50">
                El producto que intentas consultar no existe o ya no está
                disponible.
              </p>

              <Link
                href="/tienda"
                className="mt-6 inline-flex rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
              >
                Ir a tienda
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  const productRecord = product as Product;

  const [{ data: variants }, { data: category }, { data: subcategory }] = await Promise.all([
    supabase
      .from("product_variants")
      .select("id, product_id, name, sku, option_1_label, option_1_value, option_2_label, option_2_value, price_cop, stock, is_active")
      .eq("product_id", productRecord.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    productRecord.category_id
      ? supabase
          .from("product_categories")
          .select("id, name, slug")
          .eq("id", productRecord.category_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    productRecord.subcategory_id
      ? supabase
          .from("product_subcategories")
          .select("id, name, slug")
          .eq("id", productRecord.subcategory_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const variantList = ((variants ?? []) as ProductVariant[]).filter(
    (variant) => variant.is_active !== false
  );
  const categoryRecord = category as ProductCategory | null;
  const subcategoryRecord = subcategory as ProductSubcategory | null;
  const stock = getStockFromProduct(productRecord, variantList);
  const stockPercentage = Math.min((stock / 10) * 100, 100);

  const barColor =
    stock === 0
      ? "bg-red-400"
      : stock <= 3
      ? "bg-yellow-400"
      : "bg-white/70";

  const whatsappNumber =
    process.env.NEXT_PUBLIC_SAMORA_WHATSAPP_NUMBER ?? "573138429568";

  const productUrl = `${
    process.env.NEXT_PUBLIC_SITE_URL || "https://samoraestudiocreativo.com"
  }/tienda/${productRecord.slug}`;

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${getWhatsappMessage(
    productRecord,
    productUrl
  )}`;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
          <Link
            href="/tienda"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Volver a tienda
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-start">
            <div className="premium-card overflow-hidden rounded-[2rem]">
              {productRecord.image_url ? (
                <div className="flex h-[360px] items-center justify-center overflow-hidden bg-black sm:h-[460px] lg:h-[620px]">
                  <img
                    src={productRecord.image_url}
                    alt={productRecord.name}
                    className="image-premium h-full w-full"
                    style={getImageStyle(productRecord)}
                  />
                </div>
              ) : (
                <div className="flex h-[360px] items-center justify-center bg-black text-white/35 sm:h-[460px] lg:h-[620px]">
                  Sin imagen
                </div>
              )}
            </div>

            <aside className="premium-card rounded-[2rem] p-5 sm:p-7 lg:sticky lg:top-28">
              <div className="flex flex-wrap gap-2">
                {categoryRecord && (
                  <Link
                    href={`/tienda?categoria=${categoryRecord.slug}`}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/45 transition hover:border-white/25 hover:text-white"
                  >
                    {categoryRecord.name}
                  </Link>
                )}
                {subcategoryRecord && categoryRecord && (
                  <Link
                    href={`/tienda?categoria=${categoryRecord.slug}&subcategoria=${subcategoryRecord.slug}`}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/45 transition hover:border-white/25 hover:text-white"
                  >
                    {subcategoryRecord.name}
                  </Link>
                )}
              </div>

              <p className="mt-5 text-sm uppercase tracking-[0.35em] text-white/35">
                Producto
              </p>

              <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] md:text-6xl">
                {productRecord.name}
              </h1>

              <p className="mt-6 text-base leading-7 text-white/55 md:text-lg md:leading-8">
                {productRecord.description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <span className="text-3xl font-bold">
                  {variantList.length > 0 ? "Desde " : ""}{getPriceLabel(productRecord, variantList)}
                </span>

                <span className="rounded-full border border-white/10 bg-black px-4 py-2 text-sm text-white/50">
                  Stock total: {stock}
                </span>
              </div>

              {stock > 0 && stock <= 5 && (
                <p className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm font-medium text-yellow-400">
                  Solo quedan {stock} unidades disponibles entre todas las opciones.
                </p>
              )}

              <p className="mt-4 text-sm text-white/60">
                {stock > 0
                  ? "En stock • Entrega por coordinar con el equipo"
                  : "Producto agotado"}
              </p>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-sm">
                  {stock === 0 ? (
                    <span className="font-medium text-red-400">Agotado</span>
                  ) : stock <= 3 ? (
                    <span className="font-medium text-yellow-400">
                      Últimas unidades
                    </span>
                  ) : (
                    <span className="font-medium text-white/45">
                      Disponible
                    </span>
                  )}

                  <span className="text-white/35">{stock} disponibles</span>
                </div>

                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${stockPercentage}%` }}
                  />
                </div>
              </div>

              <div className="mt-8">
                {stock > 0 ? (
                  <>
                    <AddToCartButton
                      product={{
                        id: productRecord.id,
                        name: productRecord.name,
                        slug: productRecord.slug,
                        price: Number(productRecord.price ?? 0),
                        image_url: productRecord.image_url,
                        stock: productRecord.stock,
                        product_category: categoryRecord?.name ?? null,
                        product_subcategory: subcategoryRecord?.name ?? null,
                      }}
                      variants={variantList}
                    />

                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex min-h-12 items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-medium text-white transition hover:bg-white hover:text-black"
                    >
                      Consultar por WhatsApp
                    </a>

                    <div className="mt-5 grid gap-3 text-sm text-white/55 sm:grid-cols-3 lg:grid-cols-1">
                      <Benefit text="Pedido seguro" />
                      <Benefit text="Pago manual ahora / Wompi más adelante" />
                      <Benefit text="Atención directa por WhatsApp" />
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      disabled
                      className="flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-full bg-white/10 px-8 py-4 text-sm font-medium text-white/40"
                    >
                      Producto agotado
                    </button>

                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 flex min-h-12 items-center justify-center rounded-full border border-white/20 px-8 py-4 text-sm font-medium text-white transition hover:bg-white hover:text-black"
                    >
                      Consultar disponibilidad
                    </a>
                  </>
                )}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

function Benefit({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-3">
      <p>✔ {text}</p>
    </div>
  );
}
