import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import PrintProposalButton from "@/components/PrintProposalButton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Constancia de reserva | Admin Samora",
  description: "Vista imprimible de constancia de reserva para servicios de Samora Estudio.",
};

export const dynamic = "force-dynamic";

type ReservationQuote = {
  id: string;
  quote_code: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_document: string | null;
  service_label: string;
  event_date: string | null;
  service_location: string | null;
  duration_value: number | null;
  duration_unit: string | null;
  duration_hours: number | null;
  confirmed_event_date: string | null;
  confirmed_start_time: string | null;
  confirmed_end_time: string | null;
  confirmed_location: string | null;
  confirmed_timezone: string | null;
  schedule_notes: string | null;
  selected_package: string | null;
  final_price_cop: number | null;
  reservation_status: string | null;
  deposit_required_cop: number | null;
  deposit_paid_cop: number | null;
  payment_method: string | null;
  payment_provider: string | null;
  payment_reference: string | null;
  payment_status: string | null;
  paid_at: string | null;
  reservation_confirmed_at: string | null;
  reservation_notes: string | null;
  created_at: string;
};

const SAMORA_TEAL = "#285564";
const SAMORA_CREAM = "#f4f1eb";

const reservationStatusLabels: Record<string, string> = {
  pending_deposit: "Pendiente de abono",
  reserved: "Reservada",
  no_deposit_required: "Sin abono requerido",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  failed: "Fallido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  not_required: "No requerido",
};

const paymentProviderLabels: Record<string, string> = {
  manual: "Manual",
  wompi: "Wompi",
};

const paymentMethodLabels: Record<string, string> = {
  nequi: "Nequi",
  transferencia: "Transferencia",
  efectivo: "Efectivo",
  wompi: "Wompi",
  otro: "Otro",
};

function formatCOP(value: number | null | undefined) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  })
    .format(Number(value ?? 0))
    .replace("COP", "")
    .trim();
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "Por definir";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(
    new Date(`${value}T00:00:00`)
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Por definir";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Por definir";

  const [rawHours, rawMinutes] = value.slice(0, 5).split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value.slice(0, 5);

  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(2000, 0, 1, hours, minutes));
}

function getDurationLabel(quote: ReservationQuote) {
  const totalMinutes = Number(quote.duration_value ?? 0);

  if (quote.duration_unit === "minutos_totales" && totalMinutes > 0) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];

    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "minuto" : "minutos"}`);

    return parts.join(" y ");
  }

  if (quote.duration_hours && quote.duration_hours > 0) {
    return `${quote.duration_hours} ${quote.duration_hours === 1 ? "hora" : "horas"}`;
  }

  return "Por definir";
}

function getEventDate(quote: ReservationQuote) {
  return quote.confirmed_event_date || quote.event_date;
}

function getEventTime(quote: ReservationQuote) {
  if (quote.confirmed_start_time && quote.confirmed_end_time) {
    return `${formatTime(quote.confirmed_start_time)} - ${formatTime(quote.confirmed_end_time)}`;
  }

  if (quote.confirmed_start_time) return formatTime(quote.confirmed_start_time);
  return "Por definir";
}

function getEventLocation(quote: ReservationQuote) {
  return quote.confirmed_location || quote.service_location || "Por definir";
}

function getPaymentMethodLabel(quote: ReservationQuote) {
  const provider = paymentProviderLabels[quote.payment_provider ?? "manual"] ?? "Manual";
  const method = paymentMethodLabels[quote.payment_method ?? ""] ?? "Por definir";
  return `${provider} · ${method}`;
}

function getPaymentStatusLabel(status: string | null | undefined) {
  return paymentStatusLabels[status ?? ""] ?? status ?? "Por definir";
}

function getReservationStatusLabel(status: string | null | undefined) {
  return reservationStatusLabels[status ?? ""] ?? status ?? "Por definir";
}

function getBalance(quote: ReservationQuote) {
  return Math.max(
    Number(quote.final_price_cop ?? 0) - Number(quote.deposit_paid_cop ?? 0),
    0
  );
}

function getDepositPending(quote: ReservationQuote) {
  return Math.max(
    Number(quote.deposit_required_cop ?? 0) - Number(quote.deposit_paid_cop ?? 0),
    0
  );
}

function getPublicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://samoraestudiocreativo.com"
  ).replace(/\/$/, "");
}

function getTrackingUrl(code: string) {
  return `${getPublicSiteUrl()}/seguimiento?code=${encodeURIComponent(code)}`;
}

export default async function QuoteReservationReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: quote, error } = await supabase
    .from("quote_requests")
    .select(
      `
      id,
      quote_code,
      customer_name,
      customer_phone,
      customer_email,
      customer_document,
      service_label,
      event_date,
      service_location,
      duration_value,
      duration_unit,
      duration_hours,
      confirmed_event_date,
      confirmed_start_time,
      confirmed_end_time,
      confirmed_location,
      confirmed_timezone,
      schedule_notes,
      selected_package,
      final_price_cop,
      reservation_status,
      deposit_required_cop,
      deposit_paid_cop,
      payment_method,
      payment_provider,
      payment_reference,
      payment_status,
      paid_at,
      reservation_confirmed_at,
      reservation_notes,
      created_at
    `
    )
    .eq("id", id)
    .single();

  if (error || !quote) notFound();

  const typedQuote = quote as ReservationQuote;
  const finalPrice = Number(typedQuote.final_price_cop ?? 0);
  const depositRequired = Number(typedQuote.deposit_required_cop ?? 0);
  const depositPaid = Number(typedQuote.deposit_paid_cop ?? 0);
  const balance = getBalance(typedQuote);
  const depositPending = getDepositPending(typedQuote);
  const trackingUrl = getTrackingUrl(typedQuote.quote_code);

  return (
    <>
      <div className="no-print">
        <Navbar />
      </div>

      <main className="min-h-screen bg-neutral-950 py-24 text-white print:bg-white print:py-0">
        <div className="no-print mx-auto mb-8 grid max-w-4xl gap-5 px-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/35">
              Constancia de reserva
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              {typedQuote.quote_code}
            </h1>
            <p className="mt-2 text-sm text-white/45">
              Guarda esta vista como PDF y adjúntala manualmente por WhatsApp.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Link
              href="/admin/cotizaciones"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm text-white/70 transition hover:border-white/35 hover:bg-white hover:text-black"
            >
              Volver a cotizaciones
            </Link>
            <PrintProposalButton />
          </div>
        </div>

        <section className="receipt-root mx-auto max-w-4xl px-4 print:max-w-none print:px-0">
          <article className="receipt-sheet">
            <header className="receipt-header">
              <div>
                <p className="brand-label">Samora Estudio</p>
                <h2 className="receipt-title">Constancia de reserva</h2>
                <p className="receipt-description">
                  Documento de soporte de reserva para el servicio acordado con Samora Estudio.
                </p>
              </div>

              <div className="receipt-meta">
                <p className="meta-label">Código</p>
                <p className="meta-value">{typedQuote.quote_code}</p>
                <p className="meta-label meta-label-gap">Emitido</p>
                <p className="meta-small">{formatDateTime(new Date().toISOString())}</p>
              </div>
            </header>

            <div className="receipt-body">
              <div className="status-grid">
                <StatusBox label="Reserva" value={getReservationStatusLabel(typedQuote.reservation_status)} />
                <StatusBox label="Pago" value={getPaymentStatusLabel(typedQuote.payment_status)} />
                <StatusBox label="Servicio" value={typedQuote.service_label} />
              </div>

              <div className="two-grid main-info-grid">
                <Card title="Cliente">
                  <div className="info-grid">
                    <Info label="Nombre" value={typedQuote.customer_name || "Cliente Samora"} />
                    <Info label="WhatsApp" value={typedQuote.customer_phone || "No registrado"} />
                    <Info label="Correo" value={typedQuote.customer_email || "No registrado"} />
                    <Info label="Documento" value={typedQuote.customer_document || "No registrado"} />
                  </div>
                </Card>

                <Card title="Servicio reservado">
                  <div className="info-grid">
                    <Info label="Servicio" value={typedQuote.service_label} />
                    <Info label="Paquete" value={typedQuote.selected_package || "Propuesta personalizada"} />
                    <Info label="Fecha" value={formatDateOnly(getEventDate(typedQuote))} />
                    <Info label="Hora" value={getEventTime(typedQuote)} />
                    <Info label="Lugar" value={getEventLocation(typedQuote)} />
                    <Info label="Duración" value={getDurationLabel(typedQuote)} />
                  </div>
                </Card>
              </div>

              <div className="two-grid payment-grid">
                <Card title="Pago y reserva">
                  <div className="info-grid payment-info-grid">
                    <Info label="Método de pago" value={getPaymentMethodLabel(typedQuote)} />
                    <Info label="Estado" value={getPaymentStatusLabel(typedQuote.payment_status)} />
                    <Info label="Referencia" value={typedQuote.payment_reference || "No registrada"} />
                    <Info label="Fecha pago" value={formatDateTime(typedQuote.paid_at)} />
                    <Info label="Reserva confirmada" value={formatDateTime(typedQuote.reservation_confirmed_at)} />
                  </div>
                  <p className="tracking-line">Seguimiento: {trackingUrl}</p>
                </Card>

                <div className="summary-box">
                  <p className="summary-label">Valor final</p>
                  <p className="summary-main">{formatCOP(finalPrice)}</p>
                  <div className="summary-list">
                    <SummaryRow label="Abono requerido" value={formatCOP(depositRequired)} />
                    <SummaryRow label="Abonado" value={formatCOP(depositPaid)} />
                    <SummaryRow label="Abono pendiente" value={formatCOP(depositPending)} />
                    <SummaryRow label="Saldo final" value={formatCOP(balance)} strong />
                  </div>
                </div>
              </div>

              <Card title="Condiciones básicas" className="conditions-card">
                <ul className="conditions-list">
                  <li>La fecha queda bloqueada cuando la reserva aparece como confirmada por el equipo de Samora Estudio.</li>
                  <li>Cambios de fecha, lugar, duración o entregables pueden modificar condiciones y saldo final.</li>
                  <li>El saldo pendiente, si aplica, debe coordinarse según lo acordado con el cliente.</li>
                  <li>Este documento no reemplaza factura electrónica si esta es requerida legalmente.</li>
                </ul>

                {(typedQuote.reservation_notes || typedQuote.schedule_notes) && (
                  <p className="notes-box">
                    {typedQuote.reservation_notes || typedQuote.schedule_notes}
                  </p>
                )}
              </Card>

              <footer className="receipt-footer">
                Gracias por confiar en Samora Estudio. Conserva esta constancia como soporte de la reserva registrada.
              </footer>
            </div>
          </article>
        </section>
      </main>

      <ReceiptStyles />
    </>
  );
}

function ReceiptStyles() {
  return (
    <style>{`
      :root {
        --samora-teal: ${SAMORA_TEAL};
        --samora-cream: ${SAMORA_CREAM};
      }

      .receipt-root {
        font-family: "Quicksand", "Montserrat", Arial, sans-serif;
      }

      .receipt-sheet {
        width: 100%;
        min-height: 297mm;
        overflow: hidden;
        background: var(--samora-cream);
        color: #121212;
        border-radius: 0;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
      }

      .receipt-header {
        display: grid;
        grid-template-columns: 1fr minmax(255px, 0.78fr);
        gap: 30px;
        background: var(--samora-teal);
        color: white;
        padding: 34px 38px 28px;
      }

      .brand-label,
      .meta-label,
      .section-label {
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.34em;
        text-transform: uppercase;
      }

      .brand-label,
      .meta-label {
        color: rgba(255, 255, 255, 0.66);
      }

      .receipt-title {
        margin-top: 14px;
        max-width: 430px;
        font-size: 34px;
        line-height: 0.96;
        font-weight: 800;
        letter-spacing: -0.055em;
      }

      .receipt-description {
        margin-top: 12px;
        max-width: 440px;
        font-size: 13px;
        line-height: 1.55;
        color: rgba(255, 255, 255, 0.75);
      }

      .receipt-meta {
        text-align: right;
      }

      .meta-value {
        margin-top: 7px;
        font-size: 21px;
        line-height: 1.15;
        font-weight: 900;
        letter-spacing: -0.02em;
      }

      .meta-label-gap {
        margin-top: 18px;
      }

      .meta-small {
        margin-top: 7px;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.35;
      }

      .receipt-body {
        padding: 28px 38px 22px;
      }

      .status-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }

      .status-box {
        min-height: 66px;
        border-radius: 18px;
        background: #050505;
        padding: 15px 18px;
        color: white;
      }

      .status-label {
        font-size: 10px;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.35);
      }

      .status-value {
        margin-top: 8px;
        font-size: 16px;
        font-weight: 800;
        line-height: 1.2;
      }

      .two-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }

      .main-info-grid,
      .payment-grid,
      .conditions-card {
        margin-top: 18px;
      }

      .card {
        break-inside: avoid;
        border: 1px solid rgba(17, 17, 17, 0.08);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.72);
        padding: 16px 18px;
      }

      .section-label {
        margin-bottom: 12px;
        color: var(--samora-teal);
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 11px 18px;
      }

      .payment-info-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .info-label {
        font-size: 10px;
        line-height: 1.25;
        color: #6f6f6f;
      }

      .info-value {
        margin-top: 3px;
        font-size: 12.5px;
        font-weight: 800;
        line-height: 1.28;
        color: #111;
        overflow-wrap: anywhere;
      }

      .tracking-line {
        margin-top: 12px;
        font-size: 10.5px;
        line-height: 1.4;
        color: #777;
        overflow-wrap: anywhere;
      }

      .summary-box {
        break-inside: avoid;
        border-radius: 20px;
        background: #050505;
        padding: 18px 22px;
        color: white;
      }

      .summary-label {
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.26em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.42);
      }

      .summary-main {
        margin-top: 7px;
        font-size: 34px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: -0.05em;
      }

      .summary-list {
        margin-top: 16px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 14px;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 10px;
        font-size: 12.5px;
        color: rgba(255, 255, 255, 0.68);
      }

      .summary-row.strong {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 10px;
        font-weight: 800;
        color: white;
      }

      .conditions-list {
        display: grid;
        gap: 7px;
        padding: 0;
        margin: 0;
        list-style: none;
        font-size: 12.5px;
        line-height: 1.55;
        color: #333;
      }

      .conditions-list li::before {
        content: "• ";
        font-weight: 900;
      }

      .notes-box {
        margin-top: 12px;
        white-space: pre-wrap;
        border-radius: 14px;
        background: rgba(17, 17, 17, 0.05);
        padding: 12px;
        font-size: 12px;
        line-height: 1.5;
        color: #333;
      }

      .receipt-footer {
        margin-top: 18px;
        border-top: 1px solid rgba(17, 17, 17, 0.08);
        padding-top: 13px;
        text-align: center;
        font-size: 10.5px;
        line-height: 1.4;
        color: #777;
      }

      .receipt-root,
      .receipt-root * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      @media print {
        @page {
          size: A4;
          margin: 0;
        }

        html,
        body {
          width: 210mm !important;
          min-width: 210mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }

        main {
          margin: 0 !important;
          padding: 0 !important;
        }

        .no-print {
          display: none !important;
        }

        .receipt-root {
          display: block !important;
        }

        .receipt-sheet {
          width: 210mm !important;
          min-height: 297mm !important;
          max-height: 297mm !important;
          margin: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          overflow: hidden !important;
          page-break-after: auto;
          break-after: auto;
        }

        .receipt-header {
          padding: 18mm 10mm 9mm;
          gap: 10mm;
          grid-template-columns: 1fr 0.78fr;
        }

        .receipt-title {
          margin-top: 3mm;
          font-size: 27px;
        }

        .receipt-description {
          margin-top: 3mm;
          font-size: 11.2px;
          line-height: 1.42;
        }

        .brand-label,
        .meta-label,
        .section-label {
          font-size: 9px;
        }

        .meta-value {
          font-size: 17px;
        }

        .meta-small {
          font-size: 10.5px;
        }

        .receipt-body {
          padding: 7.5mm 10mm 5mm;
        }

        .status-grid,
        .two-grid {
          gap: 4mm;
        }

        .status-box {
          min-height: 15mm;
          border-radius: 12px;
          padding: 3.2mm 4.2mm;
        }

        .status-label {
          font-size: 8px;
        }

        .status-value {
          margin-top: 2mm;
          font-size: 12.2px;
        }

        .main-info-grid,
        .payment-grid,
        .conditions-card {
          margin-top: 4.3mm;
        }

        .card {
          border-radius: 14px;
          padding: 3.5mm 4mm;
        }

        .section-label {
          margin-bottom: 3mm;
        }

        .info-grid,
        .payment-info-grid {
          gap: 2.4mm 5mm;
        }

        .info-label {
          font-size: 8.8px;
        }

        .info-value {
          font-size: 10.4px;
        }

        .tracking-line {
          margin-top: 2.5mm;
          font-size: 8.6px;
        }

        .summary-box {
          border-radius: 14px;
          padding: 4mm 5mm;
        }

        .summary-label {
          font-size: 8px;
        }

        .summary-main {
          font-size: 26px;
        }

        .summary-list {
          margin-top: 3.5mm;
          padding-top: 3mm;
        }

        .summary-row {
          margin-bottom: 2.3mm;
          font-size: 10.2px;
        }

        .summary-row.strong {
          padding-top: 2.4mm;
        }

        .conditions-list {
          gap: 1.6mm;
          font-size: 10.2px;
          line-height: 1.42;
        }

        .notes-box {
          margin-top: 2.8mm;
          padding: 3mm;
          font-size: 9.6px;
          line-height: 1.42;
        }

        .receipt-footer {
          margin-top: 4mm;
          padding-top: 3mm;
          font-size: 8.8px;
        }
      }
    `}</style>
  );
}

function Card({
  title,
  className = "",
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`card ${className}`}>
      <p className="section-label">{title}</p>
      {children}
    </div>
  );
}

function StatusBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-box">
      <p className="status-label">{label}</p>
      <p className="status-value">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="info-label">{label}</p>
      <p className="info-value">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`summary-row ${strong ? "strong" : ""}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
