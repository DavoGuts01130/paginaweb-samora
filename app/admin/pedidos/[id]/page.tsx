import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Navbar from "@/components/Navbar";
import AdminStoreDropdown from "@/components/AdminStoreDropdown";
import { createClient } from "@/lib/supabase/server";
import { getSelectedOptionsText } from "@/lib/product-config";

type StoreOrderItem = {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  variant_name: string | null;
  variant_option_label: string | null;
  variant_option_value: string | null;
  variant_sku: string | null;
  selected_options: Record<string, string | number> | null;
  configuration_key: string | null;
  configuration_quantity: number | null;
  product_category: string | null;
  product_subcategory: string | null;
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
  cancelled_at: string | null;
  completed_at: string | null;
  stock_deducted_at: string | null;
  stock_restored_at: string | null;
  admin_notes: string | null;
  customer_notes: string | null;
  created_at: string;
  store_order_items: StoreOrderItem[] | null;
};

type LinkedCustomerFollowup = {
  id: string;
  related_id: string | null;
  status: string;
  priority: string;
  updated_at: string | null;
};

const orderStatusOptions = [
  { value: "new", label: "Nuevo" },
  { value: "pending_payment", label: "Pendiente de pago" },
  { value: "paid", label: "Pagado" },
  { value: "preparing", label: "Preparando" },
  { value: "ready", label: "Listo para entrega" },
  { value: "delivered", label: "Entregado" },
  { value: "completed", label: "Finalizado" },
  { value: "cancelled", label: "Cancelado" },
];

const paymentStatusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pagado" },
  { value: "failed", label: "Fallido" },
  { value: "cancelled", label: "Cancelado" },
  { value: "refunded", label: "Reembolsado" },
  { value: "not_required", label: "No requerido" },
];

const deliveryStatusOptions = [
  { value: "pending", label: "Pendiente" },
  { value: "coordinating", label: "Coordinando" },
  { value: "ready", label: "Lista" },
  { value: "delivered", label: "Entregada" },
  { value: "cancelled", label: "Cancelada" },
];

const paymentProviderOptions = [
  { value: "manual", label: "Manual" },
  { value: "wompi", label: "Wompi" },
];

const paymentMethodOptions = [
  { value: "", label: "Por definir" },
  { value: "nequi", label: "Nequi" },
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "wompi", label: "Wompi" },
  { value: "otro", label: "Otro" },
];

const customerFollowupStatusLabels: Record<string, string> = {
  pendiente_contactar: "Pendiente contactar",
  contactado: "Contactado",
  sin_respuesta: "Sin respuesta",
  esperando_cliente: "Esperando cliente",
  esperando_pago: "Esperando pago",
  esperando_comprobante: "Esperando comprobante",
  entrega_pendiente: "Entrega pendiente",
  seguimiento_programado: "Seguimiento programado",
  revisar_manual: "Revisar manual",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
};

const adminStoreInputClass =
  "min-h-[2.85rem] w-full rounded-[0.9rem] border border-white/10 bg-white/[0.035] px-3.5 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/40";

function formatCOP(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString("es-CO")}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Sin fecha";

  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getOrderStatusLabel(status: string) {
  return orderStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getPaymentStatusLabel(status: string) {
  return paymentStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getDeliveryStatusLabel(status: string) {
  return deliveryStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getPaymentMethodLabel(method: string | null) {
  return (
    paymentMethodOptions.find((option) => option.value === (method ?? ""))?.label ??
    "Por definir"
  );
}

function getStatusClass(status: string) {
  if (status === "new") return "border-blue-400/25 bg-blue-400/10 text-blue-200";
  if (status === "pending_payment") return "border-yellow-400/25 bg-yellow-400/10 text-yellow-200";
  if (status === "paid") return "border-green-400/25 bg-green-400/10 text-green-200";
  if (status === "preparing") return "border-cyan-400/25 bg-cyan-400/10 text-cyan-200";
  if (status === "ready") return "border-purple-400/25 bg-purple-400/10 text-purple-200";
  if (status === "delivered") return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  if (status === "completed") return "border-white/20 bg-white/10 text-white";
  if (status === "cancelled") return "border-red-400/25 bg-red-400/10 text-red-200";

  return "border-white/10 bg-white/[0.03] text-white/60";
}

function getItemVariantLabel(item: StoreOrderItem) {
  const configured = getSelectedOptionsText(item.selected_options);
  if (configured) return configured;

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

function normalizePhoneForWhatsapp(phone: string | null | undefined) {
  const onlyNumbers = (phone ?? "").replace(/\D/g, "");

  if (!onlyNumbers) return "";
  if (onlyNumbers.startsWith("57")) return onlyNumbers;
  if (onlyNumbers.length === 10) return `57${onlyNumbers}`;

  return onlyNumbers;
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

function getOrderItemsSummary(order: StoreOrder) {
  if (!order.store_order_items || order.store_order_items.length === 0) {
    return "Productos por confirmar.";
  }

  return order.store_order_items
    .map((item) => {
      const variantLabel = getItemVariantLabel(item);

      return `• ${item.product_name}${variantLabel ? ` (${variantLabel})` : ""} x${item.quantity} (${formatCOP(item.total_cop)})`;
    })
    .join("\n");
}

function getOrderDeliverySummary(order: StoreOrder) {
  const deliveryType =
    order.delivery_type === "delivery"
      ? "Domicilio / envío"
      : "Recoger / coordinar entrega";

  return [
    `*Tipo:* ${deliveryType}`,
    `*Ciudad:* ${order.delivery_city || "Por coordinar"}`,
    order.delivery_address ? `*Dirección:* ${order.delivery_address}` : "",
    order.delivery_notes ? `*Notas:* ${order.delivery_notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildStoreOrderWhatsappMessage(
  order: StoreOrder,
  type:
    | "order_received"
    | "request_payment_proof"
    | "payment_confirmed"
    | "order_ready"
    | "order_delivered"
    | "receipt_sent"
    | "order_cancelled"
) {
  const customerName = order.customer_name || "gracias por tu compra";
  const trackingUrl = getTrackingUrl(order.order_code);
  const itemsSummary = getOrderItemsSummary(order);
  const paymentMethod = `${
    order.payment_provider === "wompi" ? "Wompi" : "Manual"
  } · ${getPaymentMethodLabel(order.payment_method)}`;

  const baseHeader = ["*SAMORA ESTUDIO*", `*Pedido:* ${order.order_code}`, ""];

  if (type === "order_received") {
    return [
      ...baseHeader,
      `Hola ${customerName}, recibimos tu pedido de tienda correctamente.`,
      "",
      "*Resumen del pedido*",
      itemsSummary,
      "",
      `*Total:* ${formatCOP(order.total_cop)}`,
      `*Pago:* ${paymentMethod}`,
      "",
      "Nuestro equipo revisará disponibilidad, pago y entrega para continuar.",
      "",
      `Puedes consultar el seguimiento aquí: ${trackingUrl}`,
      "",
      "Samora Estudio",
    ].join("\n");
  }

  if (type === "request_payment_proof") {
    return [
      ...baseHeader,
      `Hola ${customerName}, para continuar con tu pedido necesitamos confirmar el pago.`,
      "",
      `*Total:* ${formatCOP(order.total_cop)}`,
      `*Método seleccionado:* ${paymentMethod}`,
      "",
      "Por favor envíanos el comprobante de pago por este chat para validar la compra y coordinar la entrega.",
      "",
      `Seguimiento: ${trackingUrl}`,
      "",
      "Samora Estudio",
    ].join("\n");
  }

  if (type === "payment_confirmed") {
    return [
      ...baseHeader,
      `Hola ${customerName}, ya confirmamos el pago de tu pedido.`,
      "",
      "Ahora continuamos con la preparación y coordinación de entrega.",
      "",
      "*Entrega*",
      getOrderDeliverySummary(order),
      "",
      `Seguimiento: ${trackingUrl}`,
      "",
      "Samora Estudio",
    ].join("\n");
  }

  if (type === "order_ready") {
    return [
      ...baseHeader,
      `Hola ${customerName}, tu pedido ya está listo para entrega o coordinación final.`,
      "",
      "*Entrega*",
      getOrderDeliverySummary(order),
      "",
      "Por favor confírmanos disponibilidad para coordinar la entrega o recogida.",
      "",
      `Seguimiento: ${trackingUrl}`,
      "",
      "Samora Estudio",
    ].join("\n");
  }

  if (type === "order_delivered") {
    return [
      ...baseHeader,
      `Hola ${customerName}, confirmamos que tu pedido fue entregado.`,
      "",
      "Gracias por confiar en Samora Estudio. Esperamos que disfrutes este recuerdo.",
      "",
      `Seguimiento: ${trackingUrl}`,
      "",
      "Samora Estudio",
    ].join("\n");
  }

  if (type === "receipt_sent") {
    return [
      ...baseHeader,
      `Hola ${customerName}, te compartimos el comprobante de tu pedido.`,
      "",
      "En el PDF adjunto encontrarás el resumen de la compra, productos, valor total, estado de pago y datos de entrega registrados por el equipo de Samora Estudio.",
      "",
      `*Total:* ${formatCOP(order.total_cop)}`,
      `*Pago:* ${paymentMethod}`,
      "",
      `También puedes consultar el seguimiento aquí: ${trackingUrl}`,
      "",
      "Samora Estudio",
    ].join("\n");
  }

  return [
    ...baseHeader,
    `Hola ${customerName}, te informamos que tu pedido fue cancelado.`,
    "",
    "Si tienes alguna duda o deseas revisar otra opción, puedes responder a este mensaje y con gusto te ayudaremos.",
    "",
    `Seguimiento: ${trackingUrl}`,
    "",
    "Samora Estudio",
  ].join("\n");
}

function buildWhatsappHref(
  phone: string | null | undefined,
  message: string
) {
  const normalizedPhone = normalizePhoneForWhatsapp(phone);

  if (!normalizedPhone) return "";

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

async function updateStoreOrderAction(formData: FormData) {
  "use server";

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

  const orderId = String(formData.get("order_id") ?? "");
  const status = String(formData.get("status") ?? "new");
  const paymentStatus = String(formData.get("payment_status") ?? "pending");
  const paymentProvider = String(formData.get("payment_provider") ?? "manual");
  const paymentMethodValue = String(formData.get("payment_method") ?? "");
  const deliveryStatus = String(formData.get("delivery_status") ?? "pending");
  const paymentReference = String(
    formData.get("payment_reference") ?? ""
  ).trim();
  const externalPaymentId = String(
    formData.get("external_payment_id") ?? ""
  ).trim();
  const paymentLinkUrl = String(formData.get("payment_link_url") ?? "").trim();
  const paidAtValue = String(formData.get("paid_at") ?? "").trim();
  const adminNotes = String(formData.get("admin_notes") ?? "").trim();

  if (!orderId) return;

  const { data: currentOrder } = await supabase
    .from("store_orders")
    .select(
      "status,payment_status,paid_at,completed_at,cancelled_at,stock_deducted_at,stock_restored_at"
    )
    .eq("id", orderId)
    .single();

  const now = new Date().toISOString();

  const payload: Record<string, string | null> = {
    status,
    payment_status: paymentStatus,
    payment_provider: paymentProvider,
    payment_method: paymentMethodValue || null,
    delivery_status: deliveryStatus,
    payment_reference: paymentReference || null,
    external_payment_id: externalPaymentId || null,
    payment_link_url: paymentLinkUrl || null,
    paid_at: paidAtValue
      ? new Date(paidAtValue).toISOString()
      : currentOrder?.paid_at ?? null,
    admin_notes: adminNotes || null,
  };

  if (paymentStatus === "paid" && currentOrder?.payment_status !== "paid") {
    payload.paid_at = paidAtValue
      ? new Date(paidAtValue).toISOString()
      : now;
  }

  if (paymentStatus !== "paid" && !paidAtValue) {
    payload.paid_at = null;
  }

  if (status === "completed" && currentOrder?.status !== "completed") {
    payload.completed_at = now;
  }

  if (status !== "completed") {
    payload.completed_at = null;
  }

  if (status === "cancelled" && currentOrder?.status !== "cancelled") {
    payload.cancelled_at = now;
  }

  if (status !== "cancelled") {
    payload.cancelled_at = null;
  }

  await supabase.from("store_orders").update(payload).eq("id", orderId);

  revalidatePath(`/admin/pedidos/${orderId}`);
  revalidatePath("/admin/pedidos");
  revalidatePath("/tienda");
}

export default async function AdminPedidoDetailPage({
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
      *,
      store_order_items (
        id,
        product_id,
        variant_id,
        variant_name,
        variant_option_label,
        variant_option_value,
        variant_sku,
        selected_options,
        configuration_key,
        configuration_quantity,
        product_category,
        product_subcategory,
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

  const { data: linkedFollowup } = await supabase
    .from("customer_followups")
    .select("id, related_id, status, priority, updated_at")
    .eq("related_type", "store_order")
    .eq("related_id", typedOrder.id)
    .maybeSingle();

  const customerFollowup =
    (linkedFollowup as LinkedCustomerFollowup | null) ?? null;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/admin/pedidos"
              className="text-sm text-white/50 transition hover:text-white"
            >
              ← Volver a pedidos
            </Link>

            <div className="flex flex-wrap gap-3">
              {customerFollowup ? (
                <Link
                  href={`/admin/seguimiento-clientes?focus=${customerFollowup.id}`}
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs text-emerald-100/80 transition hover:border-emerald-300/45 hover:text-emerald-50"
                >
                  Ver seguimiento CRM →
                </Link>
              ) : (
                <span className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/35">
                  Sin seguimiento CRM
                </span>
              )}

              <Link
                href={`/admin/pedidos/${typedOrder.id}/comprobante`}
                target="_blank"
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs text-white/70 transition hover:bg-white hover:text-black"
              >
                Comprobante →
              </Link>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.35em] text-white/35">
              Pedido de tienda
            </p>

            <h1 className="mt-4 break-words text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
              {typedOrder.order_code || typedOrder.id}
            </h1>

            <p className="mt-3 text-lg text-white/60">
              {typedOrder.customer_name} · {formatCOP(typedOrder.total_cop)}
            </p>

            <p className="mt-2 text-sm text-white/35">
              Creado {formatDateTime(typedOrder.created_at)}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Badge className={getStatusClass(typedOrder.status)}>
              {getOrderStatusLabel(typedOrder.status)}
            </Badge>

            <Badge
              className={
                typedOrder.payment_status === "paid"
                  ? "border-green-400/25 bg-green-400/10 text-green-200"
                  : "border-yellow-400/25 bg-yellow-400/10 text-yellow-200"
              }
            >
              Pago: {getPaymentStatusLabel(typedOrder.payment_status)}
            </Badge>

            <Badge className="border-white/10 bg-white/[0.03] text-white/55">
              Entrega: {getDeliveryStatusLabel(typedOrder.delivery_status)}
            </Badge>

            {customerFollowup && (
              <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                CRM:{" "}
                {customerFollowupStatusLabels[customerFollowup.status] ??
                  customerFollowup.status}
              </Badge>
            )}
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <InfoBlock
              title="Cliente"
              items={[
                ["Nombre", typedOrder.customer_name],
                ["Correo", typedOrder.customer_email || "Sin correo"],
                ["WhatsApp", typedOrder.customer_phone],
                ["Documento", typedOrder.customer_document || "Sin documento"],
              ]}
            />

            <InfoBlock
              title="Entrega"
              items={[
                [
                  "Tipo",
                  typedOrder.delivery_type === "delivery"
                    ? "Domicilio / envío"
                    : "Recoger / coordinar",
                ],
                ["Estado", getDeliveryStatusLabel(typedOrder.delivery_status)],
                ["Ciudad", typedOrder.delivery_city || "Sin ciudad"],
                ["Dirección", typedOrder.delivery_address || "Sin dirección"],
              ]}
            />

            <div className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                Resumen económico
              </p>

              <div className="mt-4 space-y-3 text-sm">
                <SummaryRow
                  label="Subtotal"
                  value={formatCOP(typedOrder.subtotal_cop)}
                />
                <SummaryRow
                  label="Entrega"
                  value={formatCOP(typedOrder.delivery_price_cop)}
                />
                <SummaryRow
                  label="Descuento"
                  value={formatCOP(typedOrder.discount_cop)}
                />
              </div>

              <div className="mt-5 border-t border-white/10 pt-5">
                <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                  Total
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {formatCOP(typedOrder.total_cop)}
                </p>

                <p className="mt-4 text-xs leading-5 text-white/40">
                  {typedOrder.payment_provider === "wompi" ? "Wompi" : "Manual"} ·{" "}
                  {getPaymentMethodLabel(typedOrder.payment_method)}
                </p>
              </div>
            </div>
          </div>

          <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5 sm:p-6">
            <SectionHeader
              eyebrow="Productos"
              title="Contenido del pedido"
              description="Productos, variantes, cantidades y valores registrados en el momento de la compra."
            />

            <div className="mt-5 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-black">
              {typedOrder.store_order_items &&
              typedOrder.store_order_items.length > 0 ? (
                typedOrder.store_order_items.map((item) => {
                  const variantLabel = getItemVariantLabel(item);

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
                    >
                      {item.product_image_url ? (
                        <img
                          src={item.product_image_url}
                          alt={item.product_name}
                          className="h-20 w-20 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-neutral-950 text-[10px] text-white/25">
                          Sin imagen
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.product_name}</p>

                        {variantLabel && (
                          <p className="mt-1 text-xs leading-5 text-white/45">
                            {variantLabel}
                          </p>
                        )}

                        {(item.product_category || item.product_subcategory) && (
                          <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-white/25">
                            {[item.product_category, item.product_subcategory]
                              .filter(Boolean)
                              .join(" / ")}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-5 text-sm sm:min-w-[330px]">
                        <div>
                          <p className="text-xs text-white/35">Cantidad</p>
                          <p className="mt-1">{item.quantity}</p>
                        </div>

                        <div>
                          <p className="text-xs text-white/35">Unidad</p>
                          <p className="mt-1">{formatCOP(item.unit_price_cop)}</p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-white/35">Total</p>
                          <p className="mt-1 font-semibold">
                            {formatCOP(item.total_cop)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-sm text-white/45">
                  No hay productos asociados a este pedido.
                </div>
              )}
            </div>
          </section>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5 sm:p-6">
              <SectionHeader
                eyebrow="Operación"
                title="Gestión del pedido"
                description="Actualiza pedido, pago y entrega. Conservamos la misma lógica de inventario vinculada al estado de pago."
              />

              <form action={updateStoreOrderAction} className="mt-6">
                <input type="hidden" name="order_id" value={typedOrder.id} />

                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminField label="Estado del pedido">
                    <AdminStoreDropdown
                      name="status"
                      defaultValue={typedOrder.status}
                      options={orderStatusOptions}
                    />
                  </AdminField>

                  <AdminField label="Estado de pago">
                    <AdminStoreDropdown
                      name="payment_status"
                      defaultValue={typedOrder.payment_status}
                      options={paymentStatusOptions}
                    />
                  </AdminField>

                  <AdminField label="Proveedor">
                    <AdminStoreDropdown
                      name="payment_provider"
                      defaultValue={typedOrder.payment_provider || "manual"}
                      options={paymentProviderOptions}
                    />
                  </AdminField>

                  <AdminField label="Método">
                    <AdminStoreDropdown
                      name="payment_method"
                      defaultValue={typedOrder.payment_method || ""}
                      options={paymentMethodOptions}
                    />
                  </AdminField>

                  <AdminField label="Estado entrega">
                    <AdminStoreDropdown
                      name="delivery_status"
                      defaultValue={typedOrder.delivery_status}
                      options={deliveryStatusOptions}
                    />
                  </AdminField>

                  <AdminField label="Fecha de pago">
                    <input
                      type="datetime-local"
                      name="paid_at"
                      defaultValue={toDateTimeLocal(typedOrder.paid_at)}
                      className={adminStoreInputClass}
                    />
                  </AdminField>

                  <AdminField
                    label="Referencia / comprobante"
                    className="sm:col-span-2"
                  >
                    <input
                      name="payment_reference"
                      defaultValue={typedOrder.payment_reference || ""}
                      placeholder="Número de comprobante o referencia"
                      className={adminStoreInputClass}
                    />
                  </AdminField>

                  <AdminField
                    label="ID externo Wompi"
                    className="sm:col-span-2"
                  >
                    <input
                      name="external_payment_id"
                      defaultValue={typedOrder.external_payment_id || ""}
                      placeholder="Transaction ID futuro de Wompi"
                      className={adminStoreInputClass}
                    />
                  </AdminField>

                  <AdminField label="Link de pago" className="sm:col-span-2">
                    <input
                      name="payment_link_url"
                      defaultValue={typedOrder.payment_link_url || ""}
                      placeholder="Link de checkout Wompi cuando exista"
                      className={adminStoreInputClass}
                    />
                  </AdminField>

                  <AdminField label="Notas internas" className="sm:col-span-2">
                    <textarea
                      name="admin_notes"
                      defaultValue={typedOrder.admin_notes || ""}
                      rows={5}
                      placeholder="Notas del equipo..."
                      className={`${adminStoreInputClass} resize-none`}
                    />
                  </AdminField>
                </div>

                <button
                  type="submit"
                  className="mt-5 flex min-h-11 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                >
                  Guardar cambios
                </button>
              </form>
            </section>

            <div className="space-y-6">
              <InventoryStatus order={typedOrder} />
              <StoreWhatsappActions order={typedOrder} />
            </div>
          </div>

          {(typedOrder.customer_notes || typedOrder.delivery_notes) && (
            <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5 sm:p-6">
              <SectionHeader
                eyebrow="Observaciones"
                title="Notas del pedido"
                description="Información registrada por el cliente o relacionada con la entrega."
              />

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {typedOrder.customer_notes && (
                  <NoteBlock
                    title="Notas del cliente"
                    value={typedOrder.customer_notes}
                  />
                )}

                {typedOrder.delivery_notes && (
                  <NoteBlock
                    title="Notas de entrega"
                    value={typedOrder.delivery_notes}
                  />
                )}
              </div>
            </section>
          )}
        </section>
      </main>
    </>
  );
}

function InventoryStatus({ order }: { order: StoreOrder }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-white/30">
        Inventario
      </p>

      <h2 className="mt-2 text-xl font-semibold">Estado del stock</h2>

      {order.stock_restored_at ? (
        <p className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-200/85">
          Stock restaurado el {formatDateTime(order.stock_restored_at)}.
        </p>
      ) : order.stock_deducted_at ? (
        <p className="mt-4 rounded-2xl border border-green-400/20 bg-green-400/10 p-4 text-sm leading-6 text-green-200/85">
          Stock descontado el {formatDateTime(order.stock_deducted_at)}.
        </p>
      ) : order.payment_status === "paid" ? (
        <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm leading-6 text-red-200/85">
          El pedido figura pagado pero todavía no registra descuento de stock.
          Revisa la lógica de inventario seguro antes de continuar.
        </p>
      ) : (
        <p className="mt-4 rounded-2xl border border-white/10 bg-black p-4 text-sm leading-6 text-white/45">
          El stock permanece pendiente hasta confirmar el pago.
        </p>
      )}
    </div>
  );
}

function StoreWhatsappActions({ order }: { order: StoreOrder }) {
  const actions = [
    {
      key: "order_received",
      label: "Pedido recibido",
      description: "Confirma que el pedido quedó registrado.",
    },
    {
      key: "request_payment_proof",
      label: "Solicitar comprobante",
      description: "Pide soporte de pago manual.",
    },
    {
      key: "payment_confirmed",
      label: "Pago confirmado",
      description: "Informa que el pago fue validado.",
    },
    {
      key: "order_ready",
      label: "Pedido listo",
      description: "Coordina entrega o recogida.",
    },
    {
      key: "order_delivered",
      label: "Pedido entregado",
      description: "Cierra la entrega con agradecimiento.",
    },
    {
      key: "receipt_sent",
      label: "Enviar comprobante",
      description: "Mensaje para adjuntar el PDF del comprobante.",
    },
    {
      key: "order_cancelled",
      label: "Pedido cancelado",
      description: "Notifica cancelación con tono amable.",
    },
  ] as const;

  const hasPhone = Boolean(normalizePhoneForWhatsapp(order.customer_phone));

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-white/30">
        Comunicación
      </p>

      <h2 className="mt-2 text-xl font-semibold">
        Mensajes rápidos por WhatsApp
      </h2>

      <p className="mt-2 text-sm leading-6 text-white/40">
        Abre WhatsApp con textos listos. Revisa el mensaje antes de enviarlo.
      </p>

      {!hasPhone && (
        <p className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-xs leading-5 text-yellow-100/80">
          Este pedido no tiene un WhatsApp válido.
        </p>
      )}

      <div className="mt-4 grid gap-2">
        {actions.map((action) => {
          const href = buildWhatsappHref(
            order.customer_phone,
            buildStoreOrderWhatsappMessage(order, action.key)
          );

          if (!href) {
            return (
              <span
                key={action.key}
                className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/25"
              >
                {action.label}
              </span>
            );
          }

          return (
            <a
              key={action.key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition hover:border-white/30 hover:bg-white hover:text-black"
            >
              <span className="block text-sm font-medium">{action.label}</span>
              <span className="mt-1 block text-xs opacity-55">
                {action.description}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-white/30">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
        {title}
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
        {description}
      </p>
    </div>
  );
}

function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}

function InfoBlock({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-white/30">
        {title}
      </p>

      <div className="mt-4 space-y-3 text-sm">
        {items.map(([label, value]) => (
          <div key={label}>
            <p className="text-white/40">{label}</p>
            <p className="mt-1 break-words text-white/75">
              {value || "Sin información"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminField({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/35">
        {label}
      </span>
      {children}
    </label>
  );
}

function NoteBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-sm text-white/40">{title}</p>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/70">
        {value}
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/40">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
