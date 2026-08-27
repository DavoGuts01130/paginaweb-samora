"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useCart } from "@/components/CartProvider";
import { createClient } from "@/lib/supabase/client";
import { getSelectedOptionsText } from "@/lib/product-config";

const whatsappNumber =
  process.env.NEXT_PUBLIC_SAMORA_WHATSAPP_NUMBER ?? "573138429568";

function formatCOP(value: number) {
  return `$${Number(value ?? 0).toLocaleString("es-CO")}`;
}

function buildOrderCode() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const time = now
    .toTimeString()
    .slice(0, 8)
    .replaceAll(":", "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `PED-${date}-${time}-${random}`;
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function getVariantSummary(item: {
  variant_name?: string | null;
  variant_option_value?: string | null;
}) {
  if (
    item.variant_name &&
    item.variant_option_value &&
    item.variant_name.trim().toLowerCase() ===
      item.variant_option_value.trim().toLowerCase()
  ) {
    return item.variant_name;
  }

  return [item.variant_name, item.variant_option_value]
    .filter(Boolean)
    .join(" · ");
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [deliveryType, setDeliveryType] = useState("pickup");
  const [deliveryCity, setDeliveryCity] = useState("Guatavita, Cundinamarca");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("nequi");
  const [customerNotes, setCustomerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [createdOrderCode, setCreatedOrderCode] = useState("");

  const localStockIssue = useMemo(() => {
    return items.find((item) => {
      const stockValue = (item as { stock?: number }).stock;

      if (typeof stockValue !== "number") return false;

      const stock = Number(stockValue);
      return stock >= 0 && item.quantity > stock;
    });
  }, [items]);

  const canSubmit = useMemo(() => {
    return (
      items.length > 0 &&
      !localStockIssue &&
      customerName.trim().length >= 3 &&
      normalizePhone(customerPhone).length >= 10 &&
      !isSubmitting
    );
  }, [customerName, customerPhone, isSubmitting, items.length, localStockIssue]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      setMessage("Completa tu nombre, WhatsApp y los productos del carrito.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const supabase = createClient();
    const orderCode = buildOrderCode();

    try {
      if (localStockIssue) {
        throw new Error(
          `No hay stock suficiente para ${localStockIssue.name}. Disponible: ${(localStockIssue as { stock?: number }).stock ?? 0}, solicitado: ${localStockIssue.quantity}.`
        );
      }

      const cartItems = items.map((item) => ({
        product_id: item.product_id ?? item.id.split(":")[0],
        variant_id: item.variant_id ?? null,
        configuration_key: item.configuration_key ?? null,
        configuration_quantity: item.configuration_quantity ?? null,
        selected_options: item.selected_options ?? {},
        quantity: item.quantity,
      }));

      const { data: createdOrder, error: orderError } = await supabase.rpc(
        "create_store_order_v2",
        {
          p_order_code: orderCode,
          p_customer_name: customerName.trim(),
          p_customer_phone: normalizePhone(customerPhone),
          p_customer_email: customerEmail.trim() || null,
          p_customer_document: customerDocument.trim() || null,
          p_delivery_type: deliveryType,
          p_delivery_address: deliveryAddress.trim() || null,
          p_delivery_city: deliveryCity.trim() || null,
          p_delivery_notes: deliveryNotes.trim() || null,
          p_payment_method: paymentMethod,
          p_customer_notes: customerNotes.trim() || null,
          p_items: cartItems,
        }
      );

      if (orderError || !createdOrder) {
        throw new Error(orderError?.message || "No se pudo crear el pedido.");
      }

      const order = createdOrder as {
        id: string;
        order_code: string;
        total_cop: number;
      };

      setCreatedOrderCode(order.order_code);
      clearCart();
      setMessage("Pedido creado correctamente.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo crear el pedido. Intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const productList = items
    .map((item) => {
      const options = getSelectedOptionsText(item.selected_options);
      const variant = getVariantSummary(item);
      const detail = options || variant;

      return `• ${item.name}${detail ? ` (${detail})` : ""} x${item.quantity} (${formatCOP(
        item.price * item.quantity
      )})`;
    })
    .join("\n");

  const confirmationMessage = encodeURIComponent(
    `Hola, acabo de crear un pedido en la tienda de Samora Estudio.\n\nCódigo: ${createdOrderCode}\n\nQuedo atento/a para confirmar disponibilidad, pago y entrega.`
  );

  const cartMessage = encodeURIComponent(
    `Hola, quiero confirmar este pedido en la tienda de Samora Estudio:\n\n${productList}\n\nTotal: ${formatCOP(totalPrice)}\n\nQuedo atento/a para confirmar disponibilidad, pago y entrega.`
  );

  const whatsappLink = createdOrderCode
    ? `https://wa.me/${whatsappNumber}?text=${confirmationMessage}`
    : `https://wa.me/${whatsappNumber}?text=${cartMessage}`;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
          <Link
            href="/carrito"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Volver al carrito
          </Link>

          <div className="mt-8 animate-fade-up">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Checkout
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] md:text-6xl">
              Confirmar pedido
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 md:text-lg">
              Registra tus datos para que el equipo de Samora Estudio confirme
              disponibilidad, pago y entrega.
            </p>
          </div>

          {createdOrderCode ? (
            <div className="premium-card mt-10 rounded-[2rem] p-6 sm:p-8">
              <p className="text-sm uppercase tracking-[0.35em] text-green-300">
                Pedido creado
              </p>

              <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em]">
                Tu pedido quedó registrado.
              </h2>

              <p className="mt-4 text-white/55">
                Código del pedido: <span className="text-white">{createdOrderCode}</span>
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">
                Por ahora el pago se confirma manualmente. El equipo revisará el
                pedido y te indicará cómo continuar. Cuando Wompi esté listo,
                este mismo flujo podrá generar enlaces de pago en línea.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                >
                  Enviar confirmación por WhatsApp
                </a>

                <Link
                  href="/tienda"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-8 py-3 text-sm text-white/65 transition hover:bg-white hover:text-black"
                >
                  Volver a tienda
                </Link>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="premium-card mt-10 rounded-[1.5rem] p-8 text-center">
              <p className="text-lg font-semibold">Tu carrito está vacío.</p>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">
                Agrega productos antes de continuar al checkout.
              </p>

              <Link
                href="/tienda"
                className="mt-6 inline-flex rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
              >
                Ir a tienda
              </Link>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.42fr] lg:items-start"
            >
              <div className="space-y-5">
                <Section title="Datos del cliente">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nombre completo" required>
                      <input
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        placeholder="Nombre y apellido"
                        className="checkout-input"
                      />
                    </Field>

                    <Field label="WhatsApp" required>
                      <input
                        value={customerPhone}
                        onChange={(event) => setCustomerPhone(event.target.value)}
                        placeholder="Ej: 3138429568"
                        className="checkout-input"
                      />
                    </Field>

                    <Field label="Correo">
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(event) => setCustomerEmail(event.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="checkout-input"
                      />
                    </Field>

                    <Field label="Documento">
                      <input
                        value={customerDocument}
                        onChange={(event) =>
                          setCustomerDocument(event.target.value)
                        }
                        placeholder="Cédula o NIT"
                        className="checkout-input"
                      />
                    </Field>
                  </div>
                </Section>

                <Section title="Entrega">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Tipo de entrega">
                      <select
                        value={deliveryType}
                        onChange={(event) => setDeliveryType(event.target.value)}
                        className="checkout-input"
                      >
                        <option value="pickup">Recoger / coordinar entrega</option>
                        <option value="delivery">Domicilio / envío</option>
                      </select>
                    </Field>

                    <Field label="Ciudad / municipio">
                      <input
                        value={deliveryCity}
                        onChange={(event) => setDeliveryCity(event.target.value)}
                        placeholder="Ciudad o municipio"
                        className="checkout-input"
                      />
                    </Field>

                    <Field label="Dirección" className="sm:col-span-2">
                      <input
                        value={deliveryAddress}
                        onChange={(event) =>
                          setDeliveryAddress(event.target.value)
                        }
                        placeholder="Dirección si aplica"
                        className="checkout-input"
                      />
                    </Field>

                    <Field label="Notas de entrega" className="sm:col-span-2">
                      <textarea
                        value={deliveryNotes}
                        onChange={(event) => setDeliveryNotes(event.target.value)}
                        placeholder="Ej: horario, punto de referencia, indicaciones especiales..."
                        rows={4}
                        className="checkout-input resize-none"
                      />
                    </Field>
                  </div>
                </Section>

                <Section title="Pago">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Método de pago">
                      <select
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                        className="checkout-input"
                      >
                        <option value="nequi">Nequi</option>
                        <option value="transferencia">Transferencia bancaria</option>
                        <option value="efectivo">Efectivo</option>
                        <option value="otro">Otro</option>
                      </select>
                    </Field>

                    <div className="rounded-2xl border border-white/10 bg-black p-4 text-sm leading-6 text-white/45">
                      El pago se confirmará manualmente. Más adelante se podrá
                      conectar Wompi para checkout en línea.
                    </div>

                    <Field label="Notas del pedido" className="sm:col-span-2">
                      <textarea
                        value={customerNotes}
                        onChange={(event) => setCustomerNotes(event.target.value)}
                        placeholder="Detalles adicionales del pedido..."
                        rows={4}
                        className="checkout-input resize-none"
                      />
                    </Field>
                  </div>
                </Section>
              </div>

              <aside className="premium-card h-fit rounded-[1.5rem] p-5 sm:p-6 lg:sticky lg:top-28">
                <h2 className="text-xl font-semibold">Resumen</h2>

                <div className="mt-5 space-y-4 border-b border-white/10 pb-5">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 text-sm">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-14 w-14 rounded-xl object-cover"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.name}</p>
                        {(getSelectedOptionsText(item.selected_options) ||
                          item.variant_name) && (
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/40">
                            {getSelectedOptionsText(item.selected_options) ||
                              getVariantSummary(item)}
                          </p>
                        )}
                        <p className="mt-1 text-white/40">x{item.quantity}</p>
                      </div>

                      <p className="shrink-0 font-medium">
                        {formatCOP(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/45">Subtotal</span>
                    <span>{formatCOP(totalPrice)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-white/45">Entrega</span>
                    <span className="text-white/55">Por coordinar</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                  <span className="text-white/55">Total</span>
                  <span className="text-2xl font-bold">{formatCOP(totalPrice)}</span>
                </div>

                {localStockIssue && (
                  <p className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm leading-6 text-red-100/80">
                    No hay stock suficiente para {localStockIssue.name}. Disponible: {(localStockIssue as { stock?: number }).stock ?? 0}, solicitado: {localStockIssue.quantity}.
                  </p>
                )}

                {message && (
                  <p className="mt-5 rounded-2xl border border-white/10 bg-black p-4 text-sm leading-6 text-white/55">
                    {message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="mt-6 flex min-h-12 w-full items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
                >
                  {isSubmitting ? "Creando pedido..." : "Confirmar pedido"}
                </button>

                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex min-h-12 w-full items-center justify-center rounded-full border border-green-500 px-8 py-3 text-sm font-medium text-green-400 transition hover:bg-green-500 hover:text-black"
                >
                  Consultar por WhatsApp
                </a>
              </aside>
            </form>
          )}
        </section>
      </main>

      <style jsx global>{`
        .checkout-input {
          min-height: 3.25rem;
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.6);
          padding: 0.85rem 1rem;
          color: white;
          outline: none;
        }

        .checkout-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .checkout-input:focus {
          border-color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="premium-card rounded-[1.5rem] p-5 sm:p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
        {label} {required && <span className="text-red-300">*</span>}
      </span>
      {children}
    </label>
  );
}
