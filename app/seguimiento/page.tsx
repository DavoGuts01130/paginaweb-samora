"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const whatsappNumber =
  process.env.NEXT_PUBLIC_SAMORA_WHATSAPP_NUMBER ?? "573138429568";

type StoreOrderItem = {
  id: string;
  product_name: string;
  product_slug: string | null;
  product_image_url: string | null;
  unit_price_cop: number;
  quantity: number;
  total_cop: number;
  selected_options?: Record<string, unknown> | null;
};

type StoreOrder = {
  id: string;
  order_code: string;
  customer_name: string;
  status: string;
  subtotal_cop: number;
  delivery_price_cop: number;
  discount_cop: number;
  total_cop: number;
  delivery_type: string;
  delivery_status: string;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_notes: string | null;
  payment_provider: string;
  payment_method: string | null;
  payment_status: string;
  payment_link_url: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

type QuoteRequest = {
  id: string;
  quote_code: string;
  customer_name: string;
  service_label: string;
  status: string;
  event_date: string | null;
  service_location: string | null;
  service_zone_label: string | null;
  duration_hours: number | null;
  guest_count: number | null;
  quantity: number | null;
  selected_package: string | null;
  final_price_cop: number | null;
  confirmed_event_date: string | null;
  confirmed_start_time: string | null;
  confirmed_end_time: string | null;
  confirmed_location: string | null;
  schedule_notes: string | null;
  reservation_status: string | null;
  deposit_required_cop: number | null;
  deposit_paid_cop: number | null;
  payment_provider: string | null;
  payment_method: string | null;
  payment_status: string | null;
  paid_at: string | null;
  reservation_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

type TrackingResult =
  | {
      type: "store_order";
      order: StoreOrder;
      items: StoreOrderItem[];
    }
  | {
      type: "quote_request";
      quote: QuoteRequest;
    };

const orderStatusLabels: Record<string, string> = {
  new: "Nuevo",
  pending_payment: "Pendiente de pago",
  paid: "Pagado",
  preparing: "Preparando",
  ready: "Listo para entrega",
  delivered: "Entregado",
  completed: "Finalizado",
  cancelled: "Cancelado",
  pendiente: "Pendiente",
  "en proceso": "En proceso",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  failed: "Fallido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  not_required: "No requerido",
};

const deliveryStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  coordinating: "Coordinando",
  ready: "Lista",
  delivered: "Entregada",
  cancelled: "Cancelada",
};

const quoteStatusLabels: Record<string, string> = {
  new: "Solicitud recibida",
  reviewing: "En revisión",
  travel_review: "Revisión de desplazamiento",
  proposal_sent: "Propuesta enviada",
  approved: "Aprobada",
  reserved: "Reservada",
  completed: "Finalizada",
  cancelled: "Cancelada",
};

const reservationLabels: Record<string, string> = {
  pending_deposit: "Pendiente de abono",
  reserved: "Reservada",
  no_deposit_required: "Sin abono requerido",
};

function formatCOP(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString("es-CO")}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Por confirmar";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Por confirmar";
  }

  return date.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "No registrado";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No registrado";
  }

  return date.toLocaleString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Por confirmar";

  const [hours = "0", minutes = "0"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTone(status: string | null | undefined) {
  const value = status ?? "pending";

  if (["new", "pending", "pending_payment", "pending_deposit", "pendiente"].includes(value)) {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-400";
  }

  if (["reviewing", "travel_review", "preparing", "coordinating", "en proceso"].includes(value)) {
    return "border-blue-400/30 bg-blue-400/10 text-blue-400";
  }

  if (["paid", "approved", "reserved", "ready", "delivered", "completed", "entregado"].includes(value)) {
    return "border-green-400/30 bg-green-400/10 text-green-400";
  }

  if (["cancelled", "failed", "cancelado"].includes(value)) {
    return "border-red-400/30 bg-red-400/10 text-red-400";
  }

  if (["refunded", "not_required", "no_deposit_required"].includes(value)) {
    return "border-purple-400/30 bg-purple-400/10 text-purple-300";
  }

  return "border-white/10 bg-white/5 text-white/55";
}

function getOrderProgress(status: string) {
  if (status === "cancelled" || status === "cancelado") return 100;
  if (status === "new" || status === "pending_payment" || status === "pendiente") return 20;
  if (status === "paid") return 40;
  if (status === "preparing" || status === "en proceso") return 60;
  if (status === "ready") return 78;
  if (status === "delivered" || status === "entregado") return 92;
  if (status === "completed") return 100;
  return 20;
}

function getQuoteProgress(status: string) {
  if (status === "cancelled") return 100;
  if (status === "new") return 18;
  if (status === "reviewing" || status === "travel_review") return 35;
  if (status === "proposal_sent") return 55;
  if (status === "approved") return 70;
  if (status === "reserved") return 85;
  if (status === "completed") return 100;
  return 25;
}

function getOrderMessage(order: StoreOrder) {
  if (order.status === "cancelled" || order.status === "cancelado") {
    return "Este pedido fue cancelado. Si tienes dudas, puedes escribirnos por WhatsApp.";
  }

  if (order.payment_status !== "paid") {
    return "Tu pedido fue recibido. El equipo de Samora Estudio confirmará el pago y la disponibilidad antes de continuar.";
  }

  if (order.status === "preparing" || order.status === "en proceso") {
    return "Tu pedido está en preparación. Te contactaremos para coordinar los últimos detalles de entrega.";
  }

  if (order.status === "ready") {
    return "Tu pedido está listo. El equipo coordinará contigo la entrega o recogida.";
  }

  if (order.status === "delivered" || order.status === "completed" || order.status === "entregado") {
    return "Tu pedido ya fue entregado. Gracias por confiar en Samora Estudio.";
  }

  return "Tu pedido está registrado y será gestionado por el equipo de Samora Estudio.";
}

function getQuoteMessage(quote: QuoteRequest) {
  if (quote.status === "cancelled") {
    return "Esta solicitud fue cancelada. Si tienes dudas, puedes escribirnos por WhatsApp.";
  }

  if (quote.status === "completed") {
    return "Este servicio fue finalizado. Gracias por confiar en Samora Estudio.";
  }

  if (quote.status === "reserved") {
    return "Tu servicio está reservado. El equipo confirmará contigo los detalles finales antes de la fecha acordada.";
  }

  if (quote.status === "approved") {
    return "La propuesta fue aprobada. El siguiente paso es confirmar el abono o reserva del servicio.";
  }

  if (quote.status === "proposal_sent") {
    return "La propuesta final fue enviada. Revísala y confirma con el equipo si deseas aprobarla.";
  }

  return "Tu solicitud está siendo revisada por el equipo de Samora Estudio.";
}

export default function SeguimientoPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSearch(customCode?: string) {
    const trackingCode = customCode ?? code;

    if (!trackingCode.trim()) {
      setError("Ingresa el código de seguimiento.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(
        `/api/seguimiento?code=${encodeURIComponent(trackingCode.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "No encontramos información para ese código.");
        return;
      }

      setResult(data as TrackingResult);
    } catch {
      setError("No se pudo consultar el seguimiento. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryCode = params.get("code");

    if (queryCode) {
      setCode(queryCode.toUpperCase());
      handleSearch(queryCode);
    }
  }, []);

  const whatsappMessage = useMemo(() => {
    if (!result) {
      return encodeURIComponent("Hola, quiero consultar un pedido o servicio de Samora Estudio.");
    }

    const trackingCode =
      result.type === "store_order"
        ? result.order.order_code
        : result.quote.quote_code;

    return encodeURIComponent(
      `Hola, quiero consultar el estado de mi ${
        result.type === "store_order" ? "pedido" : "servicio"
      } ${trackingCode}.`
    );
  }, [result]);

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
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
              Consulta tu pedido o servicio
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
              Ingresa el código recibido para revisar el estado de un pedido de
              tienda, una cotización aprobada o un servicio reservado.
            </p>
          </div>

          <div className="premium-card mt-8 flex flex-col gap-3 rounded-[1.5rem] p-4 sm:p-5 md:flex-row">
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Código: PED-20260821-004632-RBF7 o COT-20260820-170019-26YN"
              className="min-h-12 flex-1 rounded-full border border-white/10 bg-black px-5 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-white/40 md:text-sm"
            />

            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={loading}
              className="min-h-12 rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {error && (
            <p className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
              {error}
            </p>
          )}

          {result?.type === "store_order" && (
            <StoreOrderTracking
              order={result.order}
              items={result.items}
              whatsappLink={whatsappLink}
            />
          )}

          {result?.type === "quote_request" && (
            <QuoteTracking quote={result.quote} whatsappLink={whatsappLink} />
          )}
        </section>
      </main>
    </>
  );
}

function StatusPill({ label, status }: { label: string; status: string | null | undefined }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-white/35">{label}</p>
      <span className={`mt-3 inline-flex rounded-full border px-4 py-2 text-sm font-medium ${getTone(status)}`}>
        {status && (orderStatusLabels[status] || paymentStatusLabels[status] || deliveryStatusLabels[status] || quoteStatusLabels[status] || reservationLabels[status])
          ? orderStatusLabels[status || ""] || paymentStatusLabels[status || ""] || deliveryStatusLabels[status || ""] || quoteStatusLabels[status || ""] || reservationLabels[status || ""]
          : "Por confirmar"}
      </span>
    </div>
  );
}

function StoreOrderTracking({
  order,
  items,
  whatsappLink,
}: {
  order: StoreOrder;
  items: StoreOrderItem[];
  whatsappLink: string;
}) {
  const progress = getOrderProgress(order.status);

  return (
    <div className="mt-8 space-y-6 animate-fade-up">
      <div className="premium-card rounded-[1.5rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.3em] text-white/30">
              Pedido de tienda
            </p>
            <h2 className="mt-2 break-words text-2xl font-bold md:text-3xl">
              {order.order_code}
            </h2>
            <p className="mt-2 text-sm text-white/50 sm:text-base">
              A nombre de {order.customer_name}
            </p>
          </div>

          <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/50">
            {formatDateTime(order.created_at)}
          </span>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatusPill label="Estado del pedido" status={order.status} />
          <StatusPill label="Estado del pago" status={order.payment_status} />
          <StatusPill label="Estado de entrega" status={order.delivery_status} />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black p-5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-white/45">Avance general</span>
            <span className="font-medium text-white">{progress}%</span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                order.status === "cancelled" ? "bg-red-400" : "bg-white"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-4 text-sm leading-6 text-white/55">
            {getOrderMessage(order)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="premium-card rounded-[1.5rem] p-5 sm:p-6">
          <h3 className="text-xl font-semibold">Productos</h3>

          <div className="mt-6 space-y-4">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  {item.product_image_url && (
                    <img
                      src={item.product_image_url}
                      alt={item.product_name}
                      className="h-16 w-16 shrink-0 rounded-xl object-cover"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.product_name}</p>
                    <p className="text-sm text-white/45">Cantidad: {item.quantity}</p>
                    <p className="text-sm text-white/35">Unidad: {formatCOP(item.unit_price_cop)}</p>
                  </div>

                  <p className="shrink-0 text-sm font-semibold">{formatCOP(item.total_cop)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/45">No hay productos asociados a este pedido.</p>
            )}
          </div>

          <div className="mt-6 space-y-3 border-t border-white/10 pt-6 text-sm">
            <SummaryLine label="Subtotal" value={formatCOP(order.subtotal_cop)} />
            <SummaryLine label="Entrega" value={order.delivery_price_cop ? formatCOP(order.delivery_price_cop) : "Por coordinar"} />
            {order.discount_cop > 0 && <SummaryLine label="Descuento" value={`-${formatCOP(order.discount_cop)}`} />}
            <div className="flex items-center justify-between pt-3 text-base">
              <span className="text-white/55">Total</span>
              <span className="text-2xl font-bold">{formatCOP(order.total_cop)}</span>
            </div>
          </div>
        </div>

        <div className="premium-card rounded-[1.5rem] p-5 sm:p-6">
          <h3 className="text-xl font-semibold">Entrega y pago</h3>

          <div className="mt-6 space-y-4 text-sm">
            <Info label="Tipo de entrega" value={order.delivery_type === "delivery" ? "Domicilio / envío" : "Recoger / coordinar entrega"} />
            <Info label="Ciudad / municipio" value={order.delivery_city || "Por coordinar"} />
            <Info label="Dirección" value={order.delivery_address || "Por coordinar"} />
            <Info label="Método de pago" value={`${getPaymentProviderLabel(order.payment_provider)} · ${getPaymentMethodLabel(order.payment_method)}`} />
            <Info label="Fecha de pago" value={formatDateTime(order.paid_at)} />
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

            {order.payment_link_url && order.payment_status !== "paid" && (
              <a
                href={order.payment_link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
              >
                Ir al enlace de pago
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuoteTracking({ quote, whatsappLink }: { quote: QuoteRequest; whatsappLink: string }) {
  const progress = getQuoteProgress(quote.status);
  const pendingDeposit = Math.max(
    Number(quote.deposit_required_cop ?? 0) - Number(quote.deposit_paid_cop ?? 0),
    0
  );

  return (
    <div className="mt-8 space-y-6 animate-fade-up">
      <div className="premium-card rounded-[1.5rem] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.3em] text-white/30">
              Servicio / cotización
            </p>
            <h2 className="mt-2 break-words text-2xl font-bold md:text-3xl">
              {quote.quote_code}
            </h2>
            <p className="mt-2 text-sm text-white/50 sm:text-base">
              {quote.service_label} · A nombre de {quote.customer_name}
            </p>
          </div>

          <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/50">
            {formatDateTime(quote.created_at)}
          </span>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatusPill label="Estado" status={quote.status} />
          <StatusPill label="Reserva" status={quote.reservation_status || "pending_deposit"} />
          <StatusPill label="Pago" status={quote.payment_status || "pending"} />
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-black p-5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-white/45">Avance general</span>
            <span className="font-medium text-white">{progress}%</span>
          </div>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${quote.status === "cancelled" ? "bg-red-400" : "bg-white"}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-4 text-sm leading-6 text-white/55">
            {getQuoteMessage(quote)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="premium-card rounded-[1.5rem] p-5 sm:p-6">
          <h3 className="text-xl font-semibold">Detalles del servicio</h3>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Info label="Servicio" value={quote.service_label || "Por confirmar"} />
            <Info label="Paquete" value={quote.selected_package || "Por definir"} />
            <Info label="Fecha" value={formatDate(quote.confirmed_event_date || quote.event_date)} />
            <Info label="Hora" value={getServiceTimeLabel(quote)} />
            <Info label="Lugar" value={quote.confirmed_location || quote.service_location || "Por confirmar"} />
            <Info label="Duración" value={quote.duration_hours ? `${quote.duration_hours} horas` : "Por confirmar"} />
          </div>

          {quote.schedule_notes && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black p-4 text-sm leading-6 text-white/55">
              {quote.schedule_notes}
            </div>
          )}
        </div>

        <div className="premium-card rounded-[1.5rem] p-5 sm:p-6">
          <h3 className="text-xl font-semibold">Valor y reserva</h3>

          <div className="mt-6 space-y-4 text-sm">
            <Info label="Valor final" value={quote.final_price_cop ? formatCOP(quote.final_price_cop) : "Por definir"} />
            <Info label="Abono requerido" value={quote.deposit_required_cop ? formatCOP(quote.deposit_required_cop) : "Por definir"} />
            <Info label="Abonado" value={quote.deposit_paid_cop ? formatCOP(quote.deposit_paid_cop) : "$0"} />
            <Info label="Abono pendiente" value={formatCOP(pendingDeposit)} />
            <Info label="Método de pago" value={`${getPaymentProviderLabel(quote.payment_provider)} · ${getPaymentMethodLabel(quote.payment_method)}`} />
            <Info label="Fecha de pago" value={formatDateTime(quote.paid_at)} />
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
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/45">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/40">{label}</p>
      <p className="mt-1 break-words text-white/75">{value}</p>
    </div>
  );
}

function getPaymentProviderLabel(value: string | null | undefined) {
  if (value === "wompi") return "Wompi";
  if (value === "manual") return "Manual";
  return "Por definir";
}

function getPaymentMethodLabel(value: string | null | undefined) {
  if (value === "nequi") return "Nequi";
  if (value === "transferencia") return "Transferencia";
  if (value === "efectivo") return "Efectivo";
  if (value === "wompi") return "Wompi";
  if (value === "otro") return "Otro";
  return "Por definir";
}

function getServiceTimeLabel(quote: QuoteRequest) {
  const start = formatTime(quote.confirmed_start_time);
  const end = formatTime(quote.confirmed_end_time);

  if (start === "Por confirmar" && end === "Por confirmar") {
    return "Por confirmar";
  }

  if (end === "Por confirmar") {
    return start;
  }

  return `${start} - ${end}`;
}
