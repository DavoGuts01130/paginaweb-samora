import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Navbar from "@/components/Navbar";
import AdminStoreDropdown from "@/components/AdminStoreDropdown";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    status?: string;
    payment?: string;
    q?: string;
  }>;
};

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
  cancelled_at: string | null;
  completed_at: string | null;
  stock_deducted_at: string | null;
  admin_notes: string | null;
  customer_notes: string | null;
  created_at: string;
  store_order_items: StoreOrderItem[] | null;
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

const filterStatusOptions = [
  { value: "todos", label: "Todos" },
  ...orderStatusOptions,
];

const filterPaymentOptions = [
  { value: "todos", label: "Todos" },
  ...paymentStatusOptions,
];

const adminStoreInputClass =
  "min-h-[2.85rem] w-full rounded-[0.9rem] border border-white/10 bg-white/[0.035] px-3.5 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/40";


const paymentMethodOptions = [
  { value: "", label: "Por definir" },
  { value: "nequi", label: "Nequi" },
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo", label: "Efectivo" },
  { value: "wompi", label: "Wompi" },
  { value: "otro", label: "Otro" },
];

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
  return paymentMethodOptions.find((option) => option.value === (method ?? ""))?.label ?? "Por definir";
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
    .map((item) => `• ${item.product_name} x${item.quantity} (${formatCOP(item.total_cop)})`)
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
    | "order_cancelled"
) {
  const customerName = order.customer_name || "gracias por tu compra";
  const trackingUrl = getTrackingUrl(order.order_code);
  const itemsSummary = getOrderItemsSummary(order);
  const paymentMethod = `${order.payment_provider === "wompi" ? "Wompi" : "Manual"} · ${getPaymentMethodLabel(order.payment_method)}`;

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

function buildWhatsappHref(phone: string | null | undefined, message: string) {
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
  const paymentReference = String(formData.get("payment_reference") ?? "").trim();
  const externalPaymentId = String(formData.get("external_payment_id") ?? "").trim();
  const paymentLinkUrl = String(formData.get("payment_link_url") ?? "").trim();
  const paidAtValue = String(formData.get("paid_at") ?? "").trim();
  const adminNotes = String(formData.get("admin_notes") ?? "").trim();

  if (!orderId) return;

  const { data: currentOrder } = await supabase
    .from("store_orders")
    .select("status,payment_status,paid_at,completed_at,cancelled_at")
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
    payload.paid_at = paidAtValue ? new Date(paidAtValue).toISOString() : now;
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

  revalidatePath("/admin/pedidos");
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const params = await searchParams;

  const selectedStatus = params.status ?? "todos";
  const selectedPayment = params.payment ?? "todos";
  const searchQuery = params.q ?? "";

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

  let ordersQuery = supabase
    .from("store_orders")
    .select(
      `
      *,
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
    .order("created_at", { ascending: false });

  if (selectedStatus !== "todos") {
    ordersQuery = ordersQuery.eq("status", selectedStatus);
  }

  if (selectedPayment !== "todos") {
    ordersQuery = ordersQuery.eq("payment_status", selectedPayment);
  }

  if (searchQuery.trim()) {
    ordersQuery = ordersQuery.or(
      `customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%,order_code.ilike.%${searchQuery}%`
    );
  }

  const { data: orders } = await ordersQuery;

  const { data: allOrdersForStats } = await supabase
    .from("store_orders")
    .select("status,payment_status,total_cop");

  const totalOrders = allOrdersForStats?.length ?? 0;
  const pendingPaymentCount =
    allOrdersForStats?.filter((order) => order.status === "pending_payment").length ?? 0;
  const paidCount =
    allOrdersForStats?.filter((order) => order.payment_status === "paid").length ?? 0;
  const readyCount =
    allOrdersForStats?.filter((order) => order.status === "ready").length ?? 0;
  const completedCount =
    allOrdersForStats?.filter((order) => order.status === "completed").length ?? 0;

  const completedRevenue =
    allOrdersForStats
      ?.filter((order) => order.status === "completed" || order.status === "delivered")
      .reduce((acc, order) => acc + Number(order.total_cop ?? 0), 0) ?? 0;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
          <Link
            href="/admin"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Volver al panel
          </Link>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="animate-fade-up">
              <p className="text-sm uppercase tracking-[0.35em] text-white/35">
                Administración
              </p>

              <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-7xl">
                Pedidos
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
                Gestiona pedidos de tienda, pagos manuales, entrega y la futura
                integración con Wompi desde un panel centralizado.
              </p>
            </div>

            <div className="premium-card rounded-[1.5rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                Ingresos cerrados
              </p>

              <p className="mt-2 text-2xl font-bold sm:text-3xl">
                {formatCOP(completedRevenue)}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard label="Todos" value={totalOrders} />
            <StatCard label="Pend. pago" value={pendingPaymentCount} tone="yellow" />
            <StatCard label="Pagados" value={paidCount} tone="green" />
            <StatCard label="Listos" value={readyCount} tone="purple" />
            <StatCard label="Finalizados" value={completedCount} />
          </div>

          <form className="premium-card mt-8 rounded-[1.5rem] p-4 sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
              <input
                name="q"
                defaultValue={searchQuery}
                placeholder="Buscar por cliente, correo, teléfono o código"
                className="min-h-12 rounded-xl border border-white/10 bg-black px-4 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-white/40 md:text-sm"
              />

              <button
                type="submit"
                className="min-h-12 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
              >
                Filtrar
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <AdminField label="Estado del pedido">
                <AdminStoreDropdown
                  name="status"
                  defaultValue={selectedStatus}
                  options={filterStatusOptions}
                />
              </AdminField>

              <AdminField label="Estado de pago">
                <AdminStoreDropdown
                  name="payment"
                  defaultValue={selectedPayment}
                  options={filterPaymentOptions}
                />
              </AdminField>
            </div>
          </form>

          {(selectedStatus !== "todos" || selectedPayment !== "todos" || searchQuery) && (
            <div className="mt-4">
              <Link
                href="/admin/pedidos"
                className="inline-flex rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-300 transition hover:border-red-400/40"
              >
                Limpiar filtros
              </Link>
            </div>
          )}

          <div className="mt-8 space-y-6">
            {orders && orders.length > 0 ? (
              (orders as StoreOrder[]).map((order) => (
                <article
                  key={order.id}
                  className="premium-card rounded-[1.5rem] p-4 transition hover:border-white/20 sm:p-6"
                >
                  <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-black p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                        Pedido
                      </p>

                      <p className="mt-1 break-words text-lg font-semibold sm:text-xl">
                        {order.order_code || order.id}
                      </p>

                      <p className="mt-1 text-xs text-white/35">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={getStatusClass(order.status)}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>

                      <Badge
                        className={
                          order.payment_status === "paid"
                            ? "border-green-400/25 bg-green-400/10 text-green-200"
                            : "border-yellow-400/25 bg-yellow-400/10 text-yellow-200"
                        }
                      >
                        Pago: {getPaymentStatusLabel(order.payment_status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <InfoBlock
                      title="Cliente"
                      items={[
                        ["Nombre", order.customer_name],
                        ["Correo", order.customer_email || "Sin correo"],
                        ["WhatsApp", order.customer_phone],
                        ["Documento", order.customer_document || "Sin documento"],
                      ]}
                    />

                    <InfoBlock
                      title="Entrega"
                      items={[
                        ["Tipo", order.delivery_type === "delivery" ? "Domicilio / envío" : "Recoger / coordinar"],
                        ["Estado", getDeliveryStatusLabel(order.delivery_status)],
                        ["Ciudad", order.delivery_city || "Sin ciudad"],
                        ["Dirección", order.delivery_address || "Sin dirección"],
                      ]}
                    />

                    <div className="rounded-2xl border border-white/10 bg-black p-4 lg:text-right">
                      <p className="text-sm text-white/40">Total</p>

                      <p className="mt-1 text-2xl font-bold sm:text-3xl">
                        {formatCOP(order.total_cop)}
                      </p>

                      <p className="mt-4 text-sm text-white/40">Pago</p>

                      <p className="mt-1 text-sm text-white/70">
                        {order.payment_provider === "wompi" ? "Wompi" : "Manual"} · {getPaymentMethodLabel(order.payment_method)}
                      </p>

                      {order.stock_deducted_at && (
                        <p className="mt-3 text-xs leading-5 text-green-300/80">
                          Stock descontado: {formatDateTime(order.stock_deducted_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                    <div className="rounded-2xl border border-white/10 bg-black p-4">
                      <p className="text-sm uppercase tracking-[0.25em] text-white/30">
                        Productos
                      </p>

                      <div className="mt-4 space-y-4">
                        {order.store_order_items && order.store_order_items.length > 0 ? (
                          order.store_order_items.map((item) => (
                            <div
                              key={item.id}
                              className="flex gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0"
                            >
                              {item.product_image_url && (
                                <img
                                  src={item.product_image_url}
                                  alt={item.product_name}
                                  className="h-16 w-16 shrink-0 rounded-xl object-cover"
                                />
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium">
                                  {item.product_name}
                                </p>
                                <p className="text-sm text-white/45">
                                  Cantidad: {item.quantity}
                                </p>
                              </div>

                              <p className="shrink-0 text-sm font-semibold">
                                {formatCOP(item.total_cop)}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-white/45">
                            No hay productos asociados a este pedido.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                    <form action={updateStoreOrderAction} className="rounded-2xl border border-white/10 bg-black p-4">
                      <input type="hidden" name="order_id" value={order.id} />

                      <p className="text-sm font-medium">Gestión del pedido</p>
                      <p className="mt-1 text-xs leading-5 text-white/35">
                        Actualiza estado, pago manual, referencia o datos de Wompi cuando esté disponible.
                      </p>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <AdminField label="Estado del pedido">
                          <AdminStoreDropdown
                            name="status"
                            defaultValue={order.status}
                            options={orderStatusOptions}
                          />
                        </AdminField>

                        <AdminField label="Estado de pago">
                          <AdminStoreDropdown
                            name="payment_status"
                            defaultValue={order.payment_status}
                            options={paymentStatusOptions}
                          />
                        </AdminField>

                        <AdminField label="Proveedor">
                          <AdminStoreDropdown
                            name="payment_provider"
                            defaultValue={order.payment_provider || "manual"}
                            options={paymentProviderOptions}
                          />
                        </AdminField>

                        <AdminField label="Método">
                          <AdminStoreDropdown
                            name="payment_method"
                            defaultValue={order.payment_method || ""}
                            options={paymentMethodOptions}
                          />
                        </AdminField>

                        <AdminField label="Estado entrega">
                          <AdminStoreDropdown
                            name="delivery_status"
                            defaultValue={order.delivery_status}
                            options={deliveryStatusOptions}
                          />
                        </AdminField>

                        <AdminField label="Fecha de pago">
                          <input
                            type="datetime-local"
                            name="paid_at"
                            defaultValue={toDateTimeLocal(order.paid_at)}
                            className={adminStoreInputClass}
                          />
                        </AdminField>

                        <AdminField label="Referencia / comprobante" className="sm:col-span-2">
                          <input
                            name="payment_reference"
                            defaultValue={order.payment_reference || ""}
                            placeholder="Número de comprobante o referencia"
                            className={adminStoreInputClass}
                          />
                        </AdminField>

                        <AdminField label="ID externo Wompi" className="sm:col-span-2">
                          <input
                            name="external_payment_id"
                            defaultValue={order.external_payment_id || ""}
                            placeholder="Transaction ID futuro de Wompi"
                            className={adminStoreInputClass}
                          />
                        </AdminField>

                        <AdminField label="Link de pago" className="sm:col-span-2">
                          <input
                            name="payment_link_url"
                            defaultValue={order.payment_link_url || ""}
                            placeholder="Link de checkout Wompi cuando exista"
                            className={adminStoreInputClass}
                          />
                        </AdminField>

                        <AdminField label="Notas internas" className="sm:col-span-2">
                          <textarea
                            name="admin_notes"
                            defaultValue={order.admin_notes || ""}
                            rows={4}
                            placeholder="Notas del equipo..."
                            className={`${adminStoreInputClass} resize-none`}
                          />
                        </AdminField>
                      </div>

                      <button
                        type="submit"
                        className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                      >
                        Guardar cambios
                      </button>
                    </form>

                    <StoreWhatsappActions order={order} />
                    </div>
                  </div>

                  {(order.customer_notes || order.delivery_notes) && (
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {order.customer_notes && (
                        <NoteBlock title="Notas del cliente" value={order.customer_notes} />
                      )}
                      {order.delivery_notes && (
                        <NoteBlock title="Notas de entrega" value={order.delivery_notes} />
                      )}
                    </div>
                  )}
                </article>
              ))
            ) : (
              <div className="premium-card rounded-[1.5rem] p-8 text-center text-white/50 sm:p-10">
                No hay pedidos que coincidan con los filtros.
              </div>
            )}
          </div>
        </section>
      </main>
    </>
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
      key: "order_cancelled",
      label: "Pedido cancelado",
      description: "Notifica cancelación con tono amable.",
    },
  ] as const;

  const hasPhone = !!normalizePhoneForWhatsapp(order.customer_phone);

  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="text-sm font-medium">Mensajes rápidos por WhatsApp</p>
      <p className="mt-1 text-xs leading-5 text-white/35">
        Abre WhatsApp con textos listos. Revisa el mensaje antes de enviarlo.
      </p>

      {!hasPhone && (
        <p className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-xs leading-5 text-yellow-100/80">
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


function StatCard({
  label,
  value,
  tone = "white",
}: {
  label: string;
  value: number;
  tone?: "white" | "yellow" | "green" | "purple";
}) {
  const toneClass =
    tone === "yellow"
      ? "text-yellow-400"
      : tone === "green"
      ? "text-green-400"
      : tone === "purple"
      ? "text-purple-300"
      : "text-white";

  return (
    <div className="premium-card rounded-[1.25rem] p-4 sm:rounded-[1.5rem] sm:p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35 sm:text-sm sm:tracking-[0.25em]">
        {label}
      </p>

      <p className={`mt-3 text-2xl font-bold sm:text-3xl ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function InfoBlock({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black p-4">
      <p className="mb-4 text-sm font-medium">{title}</p>

      <div className="space-y-3 text-sm">
        {items.map(([label, value]) => (
          <div key={label}>
            <p className="text-white/40">{label}</p>
            <p className="break-words text-white/75">
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
  children: React.ReactNode;
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
