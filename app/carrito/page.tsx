"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useCart } from "@/components/CartProvider";
import { getSelectedOptionsText } from "@/lib/product-config";

function formatCOP(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString("es-CO")}`;
}

function getVariantText(item: {
  variant_name?: string | null;
  variant_option_label?: string | null;
  variant_option_value?: string | null;
  variant_sku?: string | null;
}) {
  if (
    item.variant_name &&
    item.variant_option_value &&
    item.variant_name.trim().toLowerCase() ===
      item.variant_option_value.trim().toLowerCase()
  ) {
    return [
      item.variant_name,
      item.variant_sku ? `SKU: ${item.variant_sku}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  }

  const option = [item.variant_option_label, item.variant_option_value]
    .filter(Boolean)
    .join(": ");

  return [
    item.variant_name,
    option,
    item.variant_sku ? `SKU: ${item.variant_sku}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function getItemOptionsText(item: {
  selected_options?: Record<string, string | number> | null;
  variant_name?: string | null;
  variant_option_label?: string | null;
  variant_option_value?: string | null;
  variant_sku?: string | null;
}) {
  const configured = getSelectedOptionsText(item.selected_options);
  if (configured) return configured;
  return getVariantText(item);
}

export default function CarritoPage() {
  const { items, removeItem, updateItemQuantity, clearCart, totalPrice } = useCart();

  const whatsappNumber =
    process.env.NEXT_PUBLIC_SAMORA_WHATSAPP_NUMBER ?? "573138429568";

  const productList = items
    .map((item) => {
      const optionText = getItemOptionsText(item);
      return `• ${item.name}${optionText ? ` (${optionText})` : ""} x${item.quantity} (${formatCOP(item.price)})`;
    })
    .join("\n");

  const message = encodeURIComponent(
    `Hola, quiero consultar este pedido en la tienda de Samora Estudio:\n\n${productList}\n\nTotal: ${formatCOP(
      totalPrice
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
              Revisa tus productos, opciones y cantidades antes de confirmar el pedido.
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
                className="mt-6 inline-flex rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
              >
                Ir a tienda
              </Link>
            </div>
          ) : (
            <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.42fr] lg:items-start">
              <div className="space-y-4">
                {items.map((item) => {
                  const optionText = getItemOptionsText(item);

                  return (
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

                              {optionText && (
                                <p className="mt-2 rounded-2xl border border-white/10 bg-black px-3 py-2 text-sm text-white/55">
                                  {optionText}
                                </p>
                              )}

                              {(item.product_category || item.product_subcategory) && (
                                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/30">
                                  {[item.product_category, item.product_subcategory].filter(Boolean).join(" / ")}
                                </p>
                              )}

                              <div className="mt-3 flex flex-wrap items-center gap-3">
                                <label className="text-sm text-white/45">
                                  Cantidad
                                </label>

                                <input
                                  type="number"
                                  min={1}
                                  max={item.stock ?? undefined}
                                  value={item.quantity}
                                  onChange={(event) =>
                                    updateItemQuantity(
                                      item.id,
                                      Number(event.target.value)
                                    )
                                  }
                                  className="h-10 w-20 rounded-xl border border-white/10 bg-black px-3 text-sm text-white outline-none focus:border-white/35"
                                />

                                {item.stock !== null && item.stock !== undefined && (
                                  <span className="text-xs text-white/35">
                                    Máx: {item.stock}
                                  </span>
                                )}
                              </div>

                              <p className="mt-3 text-sm text-white/60">
                                Unidad: {formatCOP(item.price)}
                              </p>
                            </div>

                            <div className="text-left sm:text-right">
                              <p className="text-lg font-bold">
                                {formatCOP(item.price * item.quantity)}
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
                  );
                })}
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
                    <span>{formatCOP(totalPrice)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/45">Entrega</span>
                    <span className="text-white/55">Por coordinar</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-white/55">Total</span>
                  <span className="text-2xl font-bold">
                    {formatCOP(totalPrice)}
                  </span>
                </div>

                <p className="mt-5 rounded-2xl border border-white/10 bg-black p-4 text-sm leading-6 text-white/45">
                  Por ahora el pago se confirma manualmente. Más adelante esta
                  estructura permitirá conectar Wompi para pagos en línea.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <Link
                    href="/checkout"
                    className="flex min-h-12 items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
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
