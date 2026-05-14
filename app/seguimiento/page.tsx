"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
};

type Order = {
  order_code: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  address: string;
  city: string;
  department: string;
  reference: string | null;
  order_items?: OrderItem[];
};

const steps = [
  {
    key: "pendiente",
    label: "Pendiente",
    description: "Pedido recibido",
  },
  {
    key: "en proceso",
    label: "En proceso",
    description: "Estamos preparando tu pedido",
  },
  {
    key: "entregado",
    label: "Entregado",
    description: "Pedido finalizado",
  },
];

function getStepIndex(status: string) {
  if (status === "cancelado") return -1;
  const index = steps.findIndex((step) => step.key === status);
  return index >= 0 ? index : 0;
}

function getProgress(status: string) {
  if (status === "cancelado") return 100;
  if (status === "pendiente") return 33;
  if (status === "en proceso") return 66;
  if (status === "entregado") return 100;
  return 33;
}

function getStatusLabel(status: string) {
  if (status === "pendiente") return "Pendiente";
  if (status === "en proceso") return "En proceso";
  if (status === "entregado") return "Entregado";
  if (status === "cancelado") return "Cancelado";
  return status;
}

function getStatusBadge(status: string) {
  if (status === "pendiente") {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-400";
  }

  if (status === "en proceso") {
    return "border-blue-400/30 bg-blue-400/10 text-blue-400";
  }

  if (status === "entregado") {
    return "border-green-400/30 bg-green-400/10 text-green-400";
  }

  if (status === "cancelado") {
    return "border-red-400/30 bg-red-400/10 text-red-400";
  }

  return "border-white/10 bg-white/5 text-white/50";
}

function getStatusMessage(status: string) {
  if (status === "pendiente") {
    return "Tu pedido fue recibido correctamente. Pronto iniciaremos la preparación.";
  }

  if (status === "en proceso") {
    return "Estamos preparando tu pedido con cuidado para coordinar la entrega.";
  }

  if (status === "entregado") {
    return "Tu pedido fue entregado exitosamente. Gracias por confiar en Samora.";
  }

  if (status === "cancelado") {
    return "Este pedido fue cancelado. Si tienes dudas, puedes escribirnos por WhatsApp.";
  }

  return "El estado de tu pedido fue actualizado.";
}

function getEstimatedDelivery(createdAt: string) {
  const date = new Date(createdAt);
  date.setDate(date.getDate() + 2);

  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function SeguimientoPage() {
  const [code, setCode] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(customCode?: string) {
    const trackingCode = customCode ?? code;

    if (!trackingCode.trim()) {
      setError("Ingresa el código del pedido.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch(
        `/api/orders/track?code=${encodeURIComponent(trackingCode.trim())}`
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se encontró el pedido.");
        return;
      }

      setOrder(data.order);
    } catch {
      setError("Error al consultar el pedido.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryCode = params.get("code");

    if (queryCode) {
      setCode(queryCode);
      handleSearch(queryCode);
    }
  }, []);

  const activeStep = order ? getStepIndex(order.status) : 0;
  const progress = order ? getProgress(order.status) : 0;

  const whatsappNumber = "573192709536";

  const whatsappMessage = order
    ? encodeURIComponent(
        `Hola, quiero consultar el estado de mi pedido ${order.order_code}.`
      )
    : encodeURIComponent("Hola, quiero consultar el estado de mi pedido.");

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 md:py-14">
          <Link
            href="/"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Volver al inicio
          </Link>

          <div className="mt-8 animate-fade-up">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Seguimiento
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-7xl">
              Consulta tu pedido
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
              Ingresa el código que recibiste al finalizar la compra para
              revisar el estado y los detalles de entrega.
            </p>
          </div>

          <div className="premium-card mt-8 flex flex-col gap-3 rounded-[1.5rem] p-4 sm:p-5 md:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Código: ORD-2026-0005"
              className="min-h-12 flex-1 rounded-full border border-white/10 bg-black px-5 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-white/40 md:text-sm"
            />

            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={loading}
              className="premium-button min-h-12 rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Buscando..." : "Buscar pedido"}
            </button>
          </div>

          {error && (
            <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              {error}
            </p>
          )}

          {order && (
            <div className="mt-8 space-y-6 animate-soft-scale">
              <div className="premium-card rounded-[1.5rem] p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                      Pedido
                    </p>

                    <h2 className="mt-2 break-words text-2xl font-bold">
                      {order.order_code}
                    </h2>

                    <p className="mt-2 text-sm text-white/50 sm:text-base">
                      A nombre de {order.customer_name}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <span
                      className={`rounded-full border px-4 py-2 text-sm font-medium ${getStatusBadge(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(order.status)}
                    </span>

                    <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/50">
                      {new Date(order.created_at).toLocaleDateString("es-CO")}
                    </span>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-white/10 bg-black p-5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="text-white/45">Progreso del pedido</span>
                    <span className="font-medium text-white">{progress}%</span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        order.status === "cancelado"
                          ? "bg-red-400"
                          : order.status === "entregado"
                          ? "bg-green-400"
                          : order.status === "en proceso"
                          ? "bg-blue-400"
                          : "bg-yellow-400"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="mt-4 text-sm leading-6 text-white/55">
                    {getStatusMessage(order.status)}
                  </p>

                  {order.status !== "cancelado" &&
                    order.status !== "entregado" && (
                      <p className="mt-2 text-sm text-white/35">
                        Entrega estimada:{" "}
                        {getEstimatedDelivery(order.created_at)}
                      </p>
                    )}
                </div>

                <div className="mt-8">
                  {order.status === "cancelado" ? (
                    <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-red-400">
                      <p className="font-semibold">Pedido cancelado</p>
                      <p className="mt-1 text-sm text-red-300/80">
                        Este pedido fue cancelado. Si tienes dudas, puedes
                        consultar directamente por WhatsApp.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="relative hidden sm:block">
                        <div className="absolute left-[16.5%] right-[16.5%] top-5 h-[2px] bg-white/10" />
                        <div
                          className="absolute left-[16.5%] top-5 h-[2px] bg-white transition-all duration-700"
                          style={{
                            width:
                              activeStep === 0
                                ? "0%"
                                : activeStep === 1
                                ? "33.5%"
                                : "67%",
                          }}
                        />

                        <div className="relative grid grid-cols-3 gap-4">
                          {steps.map((step, index) => {
                            const completed = index <= activeStep;
                            const current = index === activeStep;

                            return (
                              <div
                                key={step.key}
                                className="flex flex-col items-center text-center"
                              >
                                <div
                                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition ${
                                    completed
                                      ? "border-white bg-white text-black"
                                      : "border-white/15 bg-black text-white/35"
                                  }`}
                                >
                                  {completed ? "✓" : index + 1}
                                </div>

                                <div
                                  className={`mt-4 rounded-2xl border p-4 ${
                                    current
                                      ? "border-white/25 bg-white text-black"
                                      : completed
                                      ? "border-white/15 bg-white/[0.06] text-white"
                                      : "border-white/10 bg-black text-white/40"
                                  }`}
                                >
                                  <p className="text-sm font-semibold">
                                    {step.label}
                                  </p>
                                  <p
                                    className={`mt-1 text-xs ${
                                      current
                                        ? "text-black/60"
                                        : "text-white/40"
                                    }`}
                                  >
                                    {step.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-3 sm:hidden">
                        {steps.map((step, index) => {
                          const completed = index <= activeStep;
                          const current = index === activeStep;

                          return (
                            <div
                              key={step.key}
                              className={`rounded-2xl border p-4 ${
                                current
                                  ? "border-white/25 bg-white text-black"
                                  : completed
                                  ? "border-white/15 bg-white/[0.06] text-white"
                                  : "border-white/10 bg-black text-white/40"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                                    completed
                                      ? "border-white bg-white text-black"
                                      : "border-white/15 bg-black text-white/35"
                                  }`}
                                >
                                  {completed ? "✓" : index + 1}
                                </div>

                                <div>
                                  <p className="text-sm font-semibold">
                                    {step.label}
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      current
                                        ? "text-black/60"
                                        : "text-white/40"
                                    }`}
                                  >
                                    {step.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
                <div className="premium-card rounded-[1.5rem] p-5 sm:p-6">
                  <h3 className="text-xl font-semibold">Productos</h3>

                  <div className="mt-6 space-y-4">
                    {order.order_items && order.order_items.length > 0 ? (
                      order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 border-b border-white/5 pb-4"
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
                            $
                            {(
                              Number(item.price) * Number(item.quantity)
                            ).toLocaleString("es-CO")}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/45">
                        No hay productos asociados a este pedido.
                      </p>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
                    <span className="text-white/55">Total</span>
                    <span className="text-2xl font-bold">
                      ${Number(order.total).toLocaleString("es-CO")}
                    </span>
                  </div>
                </div>

                <div className="premium-card rounded-[1.5rem] p-5 sm:p-6">
                  <h3 className="text-xl font-semibold">Entrega</h3>

                  <div className="mt-6 space-y-3 text-sm">
                    <Info
                      label="Dirección"
                      value={order.address || "Sin dirección"}
                    />
                    <Info
                      label="Ciudad / Municipio"
                      value={order.city || "Sin ciudad"}
                    />
                    <Info
                      label="Departamento"
                      value={order.department || "Sin departamento"}
                    />

                    {order.reference && (
                      <Info label="Referencia" value={order.reference} />
                    )}
                  </div>

                  <div className="mt-8 flex flex-col gap-3">
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-12 items-center justify-center rounded-full border border-green-500 px-6 py-3 text-sm font-medium text-green-400 transition hover:bg-green-500 hover:text-black"
                    >
                      Consultar por WhatsApp
                    </a>

                    <a
                      href={`/api/orders/receipt?code=${encodeURIComponent(
                        order.order_code
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                    >
                      Ver comprobante PDF
                    </a>

                    <a
                      href={`/api/orders/receipt?code=${encodeURIComponent(
                        order.order_code
                      )}`}
                      download={`comprobante-${order.order_code}.pdf`}
                      className="flex min-h-12 items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white/70 transition hover:bg-white hover:text-black"
                    >
                      Descargar comprobante
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/40">{label}</p>
      <p className="break-words text-white/75">{value}</p>
    </div>
  );
}