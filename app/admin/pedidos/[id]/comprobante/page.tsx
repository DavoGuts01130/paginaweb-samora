import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import PrintProposalButton from "@/components/PrintProposalButton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Comprobante de pedido | Admin Samora",
  description: "Vista imprimible del comprobante de pedido de tienda de Samora Estudio.",
};

export const dynamic = "force-dynamic";

type StoreOrderItem = {
  id: string;
  product_name: string;
  product_slug: string | null;
  product_image_url: string | null;
  unit_price_cop: number;
  quantity: number;
  total_cop: number;
};

type StoreOrder = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_document: string | null;
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
  payment_reference: string | null;
  payment_link_url: string | null;
  external_payment_id: string | null;
  paid_at: string | null;
  created_at: string;
  store_order_items: StoreOrderItem[] | null;
};

const SAMORA_TEAL = "#285564";
const SAMORA_CREAM = "#f4f1eb";

const orderStatusLabels: Record<string, string> = {
  new: "Nuevo",
  pending_payment: "Pendiente de pago",
  paid: "Pagado",
  preparing: "Preparando",
  ready: "Listo para entrega",
  delivered: "Entregado",
  completed: "Finalizado",
  cancelled: "Cancelado",
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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Por definir";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(value));
}

function getOrderStatusLabel(status: string | null | undefined) {
  return orderStatusLabels[status ?? ""] ?? status ?? "Por definir";
}

function getPaymentStatusLabel(status: string | null | undefined) {
  return paymentStatusLabels[status ?? ""] ?? status ?? "Por definir";
}

function getDeliveryStatusLabel(status: string | null | undefined) {
  return deliveryStatusLabels[status ?? ""] ?? status ?? "Por definir";
}

function getPaymentMethodLabel(order: StoreOrder) {
  const provider = paymentProviderLabels[order.payment_provider] ?? "Manual";
  const method = paymentMethodLabels[order.payment_method ?? ""] ?? "Por definir";
  return `${provider} · ${method}`;
}

function getDeliveryTypeLabel(type: string) {
  return type === "delivery" ? "Domicilio / envío" : "Recoger / coordinar";
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

export default async function StoreOrderReceiptPage({
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

  const { data: order, error } = await supabase
    .from("store_orders")
    .select(
      `
      id,
      order_code,
      customer_name,
      customer_phone,
      customer_email,
      customer_document,
      status,
      subtotal_cop,
      delivery_price_cop,
      discount_cop,
      total_cop,
      delivery_type,
      delivery_status,
      delivery_address,
      delivery_city,
      delivery_notes,
      payment_provider,
      payment_method,
      payment_status,
      payment_reference,
      payment_link_url,
      external_payment_id,
      paid_at,
      created_at,
      store_order_items (
        id,
        product_name,
        product_slug,
        product_image_url,
        unit_price_cop,
        quantity,
        total_cop
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !order) notFound();

  const typedOrder = order as StoreOrder;
  const items = typedOrder.store_order_items ?? [];
  const trackingUrl = getTrackingUrl(typedOrder.order_code);

  return (
    <>
      <div className="no-print">
        <Navbar />
      </div>

      <main className="min-h-screen bg-neutral-950 py-24 text-white print:bg-white print:py-0">
        <div className="no-print mx-auto mb-8 flex max-w-4xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/35">
              Comprobante de pedido
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              {typedOrder.order_code}
            </h1>
            <p className="mt-2 text-sm text-white/45">
              Guarda esta vista como PDF y adjúntala manualmente por WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/pedidos/${typedOrder.id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm text-white/70 transition hover:border-white/35 hover:bg-white hover:text-black"
            >
              Volver a pedidos
            </Link>
            <PrintProposalButton />
          </div>
        </div>

        <section className="receipt-root mx-auto max-w-4xl px-4 print:max-w-none print:px-0">
          <article className="receipt-sheet">
            <header className="receipt-header">
              <div>
                <p className="brand-label">Samora Estudio</p>
                <h2 className="receipt-title">Comprobante de pedido</h2>
                <p className="receipt-description">
                  Resumen del pedido registrado en tienda. Este documento no reemplaza factura electrónica si esta es requerida legalmente.
                </p>
              </div>

              <div className="receipt-meta">
                <p className="meta-label">Código</p>
                <p className="meta-value">{typedOrder.order_code}</p>
                <p className="meta-label meta-label-gap">Fecha</p>
                <p className="meta-small">{formatDateTime(typedOrder.created_at)}</p>
              </div>
            </header>

            <div className="receipt-body">
              <div className="status-grid">
                <StatusBox label="Pedido" value={getOrderStatusLabel(typedOrder.status)} />
                <StatusBox label="Pago" value={getPaymentStatusLabel(typedOrder.payment_status)} />
                <StatusBox label="Entrega" value={getDeliveryStatusLabel(typedOrder.delivery_status)} />
              </div>

              <div className="two-grid main-info-grid">
                <Card title="Cliente">
                  <div className="info-grid">
                    <Info label="Nombre" value={typedOrder.customer_name} />
                    <Info label="WhatsApp" value={typedOrder.customer_phone} />
                    <Info label="Correo" value={typedOrder.customer_email || "No registrado"} />
                    <Info label="Documento" value={typedOrder.customer_document || "No registrado"} />
                  </div>
                </Card>

                <Card title="Entrega y pago">
                  <div className="info-grid">
                    <Info label="Tipo" value={getDeliveryTypeLabel(typedOrder.delivery_type)} />
                    <Info label="Ciudad" value={typedOrder.delivery_city || "Por coordinar"} />
                    <Info label="Dirección" value={typedOrder.delivery_address || "Por coordinar"} />
                    <Info label="Método" value={getPaymentMethodLabel(typedOrder)} />
                    <Info label="Fecha pago" value={formatDateTime(typedOrder.paid_at)} />
                    <Info label="Referencia" value={typedOrder.payment_reference || "No registrada"} />
                  </div>
                </Card>
              </div>

              <Card title="Productos" className="products-card">
                <div className="products-table">
                  <div className="products-row products-head">
                    <span>Producto</span>
                    <span className="center">Cant.</span>
                    <span className="right">Unidad</span>
                    <span className="right">Total</span>
                  </div>

                  {items.length > 0 ? (
                    items.map((item) => (
                      <div key={item.id} className="products-row products-item">
                        <span className="product-name">{item.product_name}</span>
                        <span className="center">{item.quantity}</span>
                        <span className="right">{formatCOP(item.unit_price_cop)}</span>
                        <span className="right strong">{formatCOP(item.total_cop)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="products-empty">No hay productos asociados.</div>
                  )}
                </div>
              </Card>

              <div className="two-grid closing-grid">
                <Card title="Observaciones">
                  <p className="notes-text">
                    {typedOrder.delivery_notes || "La entrega se coordinará según disponibilidad del equipo y datos confirmados por el cliente."}
                  </p>
                  <p className="tracking-line">Seguimiento: {trackingUrl}</p>
                </Card>

                <div className="summary-box">
                  <SummaryRow label="Subtotal" value={formatCOP(typedOrder.subtotal_cop)} />
                  <SummaryRow
                    label="Entrega"
                    value={typedOrder.delivery_price_cop > 0 ? formatCOP(typedOrder.delivery_price_cop) : "Por coordinar"}
                  />
                  <SummaryRow label="Descuento" value={formatCOP(typedOrder.discount_cop)} />
                  <div className="summary-total">
                    <p>Total</p>
                    <strong>{formatCOP(typedOrder.total_cop)}</strong>
                  </div>
                </div>
              </div>

              <footer className="receipt-footer">
                Gracias por confiar en Samora Estudio. Conserva este comprobante como soporte del pedido registrado.
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
        max-width: 390px;
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
      .products-card,
      .closing-grid {
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

      .products-table {
        overflow: hidden;
        border: 1px solid rgba(17, 17, 17, 0.08);
        border-radius: 14px;
      }

      .products-row {
        display: grid;
        grid-template-columns: 1fr 62px 96px 96px;
        align-items: center;
        gap: 12px;
      }

      .products-head {
        background: #050505;
        padding: 10px 14px;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: white;
      }

      .products-item {
        border-top: 1px solid rgba(17, 17, 17, 0.08);
        padding: 11px 14px;
        font-size: 12.5px;
      }

      .product-name,
      .strong {
        font-weight: 800;
      }

      .center {
        text-align: center;
      }

      .right {
        text-align: right;
      }

      .products-empty {
        border-top: 1px solid rgba(17, 17, 17, 0.08);
        padding: 12px 14px;
        font-size: 12px;
        color: #666;
      }

      .notes-text {
        font-size: 12.5px;
        line-height: 1.55;
        color: #333;
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

      .summary-row {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 10px;
        font-size: 12.5px;
        color: rgba(255, 255, 255, 0.68);
      }

      .summary-total {
        margin-top: 14px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        padding-top: 14px;
      }

      .summary-total p {
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 0.26em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.42);
      }

      .summary-total strong {
        display: block;
        margin-top: 7px;
        font-size: 34px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: -0.05em;
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
        .products-card,
        .closing-grid {
          margin-top: 4.3mm;
        }

        .card {
          border-radius: 14px;
          padding: 3.5mm 4mm;
        }

        .section-label {
          margin-bottom: 3mm;
        }

        .info-grid {
          gap: 2.4mm 5mm;
        }

        .info-label {
          font-size: 8.8px;
        }

        .info-value {
          font-size: 10.4px;
        }

        .products-row {
          grid-template-columns: 1fr 16mm 25mm 25mm;
          gap: 3mm;
        }

        .products-head {
          padding: 2.5mm 3.5mm;
          font-size: 8px;
        }

        .products-item {
          padding: 2.9mm 3.5mm;
          font-size: 10.4px;
        }

        .notes-text {
          font-size: 10.2px;
          line-height: 1.42;
        }

        .tracking-line {
          margin-top: 2.5mm;
          font-size: 8.6px;
        }

        .summary-box {
          border-radius: 14px;
          padding: 4mm 5mm;
        }

        .summary-row {
          margin-bottom: 2.4mm;
          font-size: 10.2px;
        }

        .summary-total {
          margin-top: 3mm;
          padding-top: 3mm;
        }

        .summary-total p {
          font-size: 8px;
        }

        .summary-total strong {
          font-size: 26px;
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="summary-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
