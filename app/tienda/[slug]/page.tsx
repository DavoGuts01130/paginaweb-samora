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

function getImageStyle(product: any): CSSProperties {
  return {
    objectFit: product.image_fit === "contain" ? "contain" : "cover",
    objectPosition: `${Number(product.image_x ?? 50)}% ${Number(
      product.image_y ?? 50
    )}%`,
    transform: `scale(${Number(product.image_zoom ?? 1)})`,
  };
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
                className="premium-button mt-6 inline-flex rounded-full bg-white px-7 py-3 text-sm font-medium text-black"
              >
                Ir a tienda
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  const stock = Number(product.stock ?? 0);
  const stockPercentage = Math.min((stock / 10) * 100, 100);

  const barColor =
    stock === 0
      ? "bg-red-400"
      : stock <= 3
      ? "bg-yellow-400"
      : "bg-white/70";

  const whatsappNumber = "573192709536";

  const productUrl = `${
    process.env.NEXT_PUBLIC_SITE_URL || "https://samora.vercel.app"
  }/tienda/${product.slug}`;

  const whatsappMessage = encodeURIComponent(
    `Hola, vi este producto en su tienda:\n\n📸 ${product.name}\n🔗 ${productUrl}\n\nQuisiera más información 🙌`
  );

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

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
              {product.image_url ? (
                <div className="flex h-[360px] items-center justify-center overflow-hidden bg-black sm:h-[460px] lg:h-[620px]">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="image-premium h-full w-full"
                    style={getImageStyle(product)}
                  />
                </div>
              ) : (
                <div className="flex h-[360px] items-center justify-center bg-black text-white/35 sm:h-[460px] lg:h-[620px]">
                  Sin imagen
                </div>
              )}
            </div>

            <aside className="premium-card rounded-[2rem] p-5 sm:p-7 lg:sticky lg:top-28">
              <p className="text-sm uppercase tracking-[0.35em] text-white/35">
                Producto
              </p>

              <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] md:text-6xl">
                {product.name}
              </h1>

              <p className="mt-6 text-base leading-7 text-white/55 md:text-lg md:leading-8">
                {product.description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <span className="text-3xl font-bold">
                  ${Number(product.price ?? 0).toLocaleString("es-CO")}
                </span>

                <span className="rounded-full border border-white/10 bg-black px-4 py-2 text-sm text-white/50">
                  Stock: {stock}
                </span>
              </div>

              {stock > 0 && stock <= 5 && (
                <p className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm font-medium text-yellow-400">
                  Solo quedan {stock} unidades disponibles.
                </p>
              )}

              <p className="mt-4 text-sm text-white/60">
                {stock > 0
                  ? "En stock • Entrega rápida en 24-48h"
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
                        id: product.id,
                        name: product.name,
                        slug: product.slug,
                        price: Number(product.price ?? 0),
                        image_url: product.image_url,
                        stock: product.stock,
                      }}
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
                      <Benefit text="Entrega en 24-48h" />
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