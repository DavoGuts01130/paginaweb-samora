"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useCart } from "@/components/CartProvider";
import { createClient } from "@/lib/supabase/client";

type CheckoutForm = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  department: string;
  city: string;
  address: string;
  reference: string;
  notes: string;
};

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState<CheckoutForm>({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    department: "",
    city: "",
    address: "",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoadingProfile(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone, department, city, address, reference")
        .eq("id", user.id)
        .single();

      setForm((current) => ({
        ...current,
        customer_name: profile?.full_name ?? "",
        customer_email: user.email ?? "",
        customer_phone: profile?.phone ?? "",
        department: profile?.department ?? "",
        city: profile?.city ?? "",
        address: profile?.address ?? "",
        reference: profile?.reference ?? "",
      }));

      setLoadingProfile(false);
    }

    loadProfile();
  }, [supabase]);

  function updateField(field: keyof CheckoutForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (items.length === 0) {
      setMessage("El carrito está vacío.");
      return;
    }

    setLoading(true);
    setMessage("");

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        department: form.department,
        city: form.city,
        address: form.address,
        reference: form.reference,
        notes: form.notes,
        total: totalPrice,
        items,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(`Error: ${data.error}`);
      setLoading(false);
      return;
    }

    clearCart();
    window.location.href = `/checkout/success?order=${data.orderId}&code=${data.orderCode}`;
  }

  const inputClass =
    "min-h-12 rounded-xl border border-white/10 bg-black px-4 py-3 text-base text-white outline-none transition placeholder:text-white/30 focus:border-white/40 md:text-sm";

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

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.75fr] lg:items-start">
            <div>
              <div className="animate-fade-up">
                <p className="text-sm uppercase tracking-[0.35em] text-white/35">
                  Checkout
                </p>

                <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] md:text-6xl">
                  Confirmar compra
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
                  Confirma tus datos y la información de envío para registrar el
                  pedido.
                </p>
              </div>

              {loadingProfile && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/45">
                  Cargando datos guardados...
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="premium-card mt-8 rounded-[1.5rem] p-5 sm:p-6"
              >
                <div className="flex flex-col gap-2 border-b border-white/10 pb-5">
                  <h2 className="text-xl font-semibold">Datos del cliente</h2>
                  <p className="text-sm leading-6 text-white/45">
                    Estos datos serán usados para registrar el pedido y
                    coordinar la entrega.
                  </p>
                </div>

                <div className="mt-6 grid gap-4">
                  <input
                    name="customer_name"
                    required
                    value={form.customer_name}
                    onChange={(e) =>
                      updateField("customer_name", e.target.value)
                    }
                    placeholder="Nombre completo"
                    autoComplete="name"
                    className={inputClass}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      name="customer_email"
                      type="email"
                      required
                      value={form.customer_email}
                      onChange={(e) =>
                        updateField("customer_email", e.target.value)
                      }
                      placeholder="Correo electrónico"
                      autoComplete="email"
                      className={inputClass}
                    />

                    <input
                      name="customer_phone"
                      required
                      value={form.customer_phone}
                      onChange={(e) =>
                        updateField("customer_phone", e.target.value)
                      }
                      placeholder="Teléfono"
                      autoComplete="tel"
                      inputMode="tel"
                      className={inputClass}
                    />
                  </div>

                  <div className="pt-4">
                    <h3 className="text-sm uppercase tracking-[0.25em] text-white/35">
                      Información de envío
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <input
                      name="department"
                      required
                      value={form.department}
                      onChange={(e) =>
                        updateField("department", e.target.value)
                      }
                      placeholder="Departamento"
                      autoComplete="address-level1"
                      className={inputClass}
                    />

                    <input
                      name="city"
                      required
                      value={form.city}
                      onChange={(e) => updateField("city", e.target.value)}
                      placeholder="Ciudad / Municipio"
                      autoComplete="address-level2"
                      className={inputClass}
                    />
                  </div>

                  <input
                    name="address"
                    required
                    value={form.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="Dirección"
                    autoComplete="street-address"
                    className={inputClass}
                  />

                  <input
                    name="reference"
                    value={form.reference}
                    onChange={(e) => updateField("reference", e.target.value)}
                    placeholder="Referencia de entrega (opcional)"
                    className={inputClass}
                  />

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Notas del pedido"
                    rows={4}
                    className="rounded-xl border border-white/10 bg-black px-4 py-3 text-base text-white outline-none transition placeholder:text-white/30 focus:border-white/40 md:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || items.length === 0}
                  className="premium-button mt-8 min-h-12 w-full rounded-full bg-white px-8 py-4 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Guardando pedido..." : "Confirmar pedido"}
                </button>

                {message && (
                  <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-center text-sm text-red-300">
                    {message}
                  </p>
                )}
              </form>
            </div>

            <aside className="premium-card h-fit rounded-[1.5rem] p-5 sm:p-6 lg:sticky lg:top-28">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <h2 className="text-xl font-semibold">Resumen del pedido</h2>
                  <p className="mt-2 text-sm text-white/40">
                    {items.length} producto{items.length === 1 ? "" : "s"} en
                    el carrito
                  </p>
                </div>

                <Link
                  href="/carrito"
                  className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/55 transition hover:bg-white hover:text-black"
                >
                  Editar
                </Link>
              </div>

              <div className="mt-6 max-h-[420px] space-y-4 overflow-y-auto pr-1">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 border-b border-white/5 pb-4"
                    >
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                        />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-sm text-white/45">
                          Cantidad: {item.quantity}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-semibold">
                        ${(item.price * item.quantity).toLocaleString("es-CO")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-white/45">
                    No hay productos en el carrito.
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
                <span className="text-white/55">Total</span>
                <span className="text-2xl font-bold">
                  ${totalPrice.toLocaleString("es-CO")}
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black p-4 text-sm leading-6 text-white/45">
                Si tienes una cuenta activa, este pedido quedará asociado a tu
                perfil para seguimiento posterior.
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4 text-sm leading-6 text-white/45">
                Recibirás un correo con el código de pedido, seguimiento y
                comprobante.
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}