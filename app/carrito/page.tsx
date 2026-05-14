"use client";

import Navbar from "@/components/Navbar";
import { useCart } from "@/components/CartProvider";
import Link from "next/link";

export default function CarritoPage() {
  const { items, removeItem, clearCart, totalPrice } = useCart();

  const whatsappNumber = "573192709536";

  const productList = items
    .map(
      (item) =>
        `• ${item.name} x${item.quantity} ($${item.price.toLocaleString(
          "es-CO"
        )})`
    )
    .join("\n");

  const message = encodeURIComponent(
    `Hola, quiero consultar este pedido:\n\n${productList}\n\nTotal: $${totalPrice.toLocaleString(
      "es-CO"
    )}\n\n¿Está disponible?`
  );

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${message}`;

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

          <div className="mt-8 animate-fade-up">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Compra
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] md:text-6xl">
              Carrito
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 md:text-lg">
              Revisa tus productos antes de confirmar el pedido.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="premium-card mt-10 rounded-[1.5rem] p-8 text-center">
              <p className="text-lg font-semibold">Tu carrito está vacío.</p>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">
                Explora la tienda y agrega productos fotográficos para iniciar
                tu pedido.
              </p>

              <Link
                href="/tienda"
                className="premium-button mt-6 inline-flex rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
              >
                Ir a tienda
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.42fr] lg:items-start">
              <div className="space-y-4">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="premium-card rounded-[1.5rem] p-4 sm:p-5"
                  >
                    <div className="flex gap-4">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-24 w-24 shrink-0 rounded-2xl object-cover sm:h-28 sm:w-28"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-semibold">
                              {item.name}
                            </h3>

                            <p className="mt-2 text-sm text-white/45">
                              Cantidad: {item.quantity}
                            </p>

                            <p className="mt-1 text-sm text-white/60">
                              Unidad: ${item.price.toLocaleString("es-CO")}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-lg font-bold">
                              $
                              {(item.price * item.quantity).toLocaleString(
                                "es-CO"
                              )}
                            </p>

                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="mt-3 text-sm text-red-400 transition hover:text-red-300"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="premium-card h-fit rounded-[1.5rem] p-5 sm:p-6 lg:sticky lg:top-28">
                <h2 className="text-xl font-semibold">Resumen</h2>

                <div className="mt-6 space-y-3 border-b border-white/10 pb-6 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/45">Productos</span>
                    <span>{items.length}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/45">Subtotal</span>
                    <span>${totalPrice.toLocaleString("es-CO")}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/45">Entrega</span>
                    <span className="text-white/55">Por coordinar</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-white/55">Total</span>
                  <span className="text-2xl font-bold">
                    ${totalPrice.toLocaleString("es-CO")}
                  </span>
                </div>

                <p className="mt-5 rounded-2xl border border-white/10 bg-black p-4 text-sm leading-6 text-white/45">
                  Entrega estimada en 24-48h. También puedes consultar la
                  disponibilidad del pedido por WhatsApp.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href="/checkout"
                    className="premium-button flex min-h-12 items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                  >
                    Continuar al checkout
                  </Link>

                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-center rounded-full border border-green-500 px-8 py-3 text-sm font-medium text-green-400 transition hover:bg-green-500 hover:text-black"
                  >
                    Consultar por WhatsApp
                  </a>

                  <button
                    type="button"
                    onClick={clearCart}
                    className="flex min-h-12 items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm text-white/65 transition hover:bg-white hover:text-black"
                  >
                    Vaciar carrito
                  </button>
                </div>
              </aside>
            </div>
          )}
        </section>
      </main>
    </>
  );
}