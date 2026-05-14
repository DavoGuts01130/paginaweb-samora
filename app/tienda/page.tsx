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
    title: "Tienda | Samora Studio",
    description:
      "Productos fotográficos y recuerdos impresos con presentación premium.",
    url: "/tienda",
    images: [
      {
        url: "/og-tienda.jpg",
        width: 1200,
        height: 630,
        alt: "Tienda Samora Studio",
      },
    ],
  },
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

export default async function TiendaPage() {
  const supabase = await createClient();

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

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
                  Productos
                </h1>

                <p className="mt-4 max-w-xl text-base leading-7 text-white/50 md:text-lg md:leading-8">
                  Descubre productos fotográficos pensados para conservar
                  recuerdos con una presentación elegante.
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

          {products && products.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const stock = Number(product.stock ?? 0);

                let stockLabel = "Disponible";
                let stockColor = "text-green-400";
                let stockBorder = "border-green-400/20 bg-green-400/10";

                if (stock === 0) {
                  stockLabel = "Agotado";
                  stockColor = "text-red-400";
                  stockBorder = "border-red-400/20 bg-red-400/10";
                } else if (stock <= 5) {
                  stockLabel = "Poco stock";
                  stockColor = "text-yellow-400";
                  stockBorder = "border-yellow-400/20 bg-yellow-400/10";
                }

                return (
                  <article
                    key={product.id}
                    className="premium-card premium-card-hover group overflow-hidden rounded-[1.5rem]"
                  >
                    {product.image_url ? (
                      <div className="flex h-64 items-center justify-center overflow-hidden bg-black sm:h-72">
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="image-premium h-full w-full"
                          style={getImageStyle(product)}
                        />
                      </div>
                    ) : (
                      <div className="flex h-64 items-center justify-center bg-black text-sm text-white/35 sm:h-72">
                        Sin imagen
                      </div>
                    )}

                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="line-clamp-2 text-xl font-semibold tracking-[-0.02em]">
                          {product.name}
                        </h2>

                        <span
                          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${stockBorder} ${stockColor}`}
                        >
                          {stockLabel}
                        </span>
                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/50">
                        {product.description}
                      </p>

                      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-2xl font-bold">
                          ${Number(product.price ?? 0).toLocaleString("es-CO")}
                        </span>

                        {stock > 0 ? (
                          <Link
                            href={`/tienda/${product.slug}`}
                            className="premium-button flex min-h-11 items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm transition hover:bg-white hover:text-black"
                          >
                            Ver producto
                          </Link>
                        ) : (
                          <span className="rounded-full border border-red-400/20 px-5 py-2 text-center text-sm text-red-400">
                            No disponible
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="premium-card mt-10 rounded-[1.5rem] p-8 text-center">
              <p className="text-lg font-semibold">
                Aún no hay productos disponibles.
              </p>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">
                Cuando el catálogo esté activo, los productos aparecerán en esta
                sección.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}