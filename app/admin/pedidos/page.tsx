import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdminStoreDropdown from "@/components/AdminStoreDropdown";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    status?: string;
    payment?: string;
    delivery?: string;
    crm?: string;
    q?: string;
    focus?: string;
  }>;
};

type StoreOrderItem = {
  id: string;
  product_name: string;
  quantity: number;
};

type StoreOrder = {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  status: string;
  total_cop: number;
  delivery_type: string;
  delivery_status: string;
  delivery_city: string | null;
  payment_provider: string;
  payment_method: string | null;
  payment_status: string;
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
  { value: "todos", label: "Todos los estados" },
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
  { value: "todos", label: "Todos los pagos" },
  { value: "pending", label: "Pendiente" },
  { value: "paid", label: "Pagado" },
  { value: "failed", label: "Fallido" },
  { value: "cancelled", label: "Cancelado" },
  { value: "refunded", label: "Reembolsado" },
  { value: "not_required", label: "No requerido" },
];

const deliveryStatusOptions = [
  { value: "todos", label: "Todas las entregas" },
  { value: "pending", label: "Pendiente" },
  { value: "coordinating", label: "Coordinando" },
  { value: "ready", label: "Lista" },
  { value: "delivered", label: "Entregada" },
  { value: "cancelled", label: "Cancelada" },
];

const crmOptions = [
  { value: "todos", label: "Todos" },
  { value: "con", label: "Con seguimiento" },
  { value: "sin", label: "Sin seguimiento" },
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

function getOrderStatusLabel(status: string) {
  return orderStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getPaymentStatusLabel(status: string) {
  return paymentStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function getDeliveryStatusLabel(status: string) {
  return deliveryStatusOptions.find((option) => option.value === status)?.label ?? status;
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

function getPaymentClass(status: string) {
  if (status === "paid") return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  if (status === "failed" || status === "cancelled") {
    return "border-red-400/25 bg-red-400/10 text-red-200";
  }
  if (status === "refunded") return "border-purple-400/25 bg-purple-400/10 text-purple-200";
  return "border-yellow-400/25 bg-yellow-400/10 text-yellow-200";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const params = await searchParams;

  const selectedStatus = params.status ?? "todos";
  const selectedPayment = params.payment ?? "todos";
  const selectedDelivery = params.delivery ?? "todos";
  const selectedCrm = params.crm ?? "todos";
  const searchQuery = (params.q ?? "").trim();
  const focusOrderId = (params.focus ?? "").trim();

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

  if (focusOrderId) {
    const focusQuery = supabase
      .from("store_orders")
      .select("id, order_code")
      .limit(1);

    const { data: focusedOrder } = isUuid(focusOrderId)
      ? await focusQuery.eq("id", focusOrderId).maybeSingle()
      : await focusQuery.eq("order_code", focusOrderId).maybeSingle();

    if (focusedOrder?.id) {
      redirect(`/admin/pedidos/${focusedOrder.id}?source=crm`);
    }
  }

  const { data: orders } = await supabase
    .from("store_orders")
    .select(
      `
      id,
      order_code,
      customer_name,
      customer_phone,
      customer_email,
      status,
      total_cop,
      delivery_type,
      delivery_status,
      delivery_city,
      payment_provider,
      payment_method,
      payment_status,
      created_at,
      store_order_items (
        id,
        product_name,
        quantity
      )
    `
    )
    .order("created_at", { ascending: false });

  const orderList = (orders ?? []) as StoreOrder[];
  const orderIds = orderList.map((order) => order.id);
  const followupsByOrderId = new Map<string, LinkedCustomerFollowup>();

  if (orderIds.length > 0) {
    const { data: orderFollowups, error: orderFollowupsError } = await supabase
      .from("customer_followups")
      .select("id, related_id, status, priority, updated_at")
      .eq("related_type", "store_order")
      .in("related_id", orderIds);

    if (orderFollowupsError) {
      console.error(
        "Error cargando seguimientos CRM de pedidos:",
        orderFollowupsError.message
      );
    }

    for (const followup of (orderFollowups ?? []) as LinkedCustomerFollowup[]) {
      if (followup.related_id) {
        followupsByOrderId.set(followup.related_id, followup);
      }
    }
  }

  const normalizedSearch = (searchQuery || focusOrderId).toLowerCase();

  const filteredOrders = orderList.filter((order) => {
    const linkedFollowup = followupsByOrderId.get(order.id);

    const matchesStatus =
      selectedStatus === "todos" || order.status === selectedStatus;

    const matchesPayment =
      selectedPayment === "todos" || order.payment_status === selectedPayment;

    const matchesDelivery =
      selectedDelivery === "todos" || order.delivery_status === selectedDelivery;

    const matchesCrm =
      selectedCrm === "todos" ||
      (selectedCrm === "con" && Boolean(linkedFollowup)) ||
      (selectedCrm === "sin" && !linkedFollowup);

    const searchable = [
      order.order_code,
      order.customer_name,
      order.customer_email,
      order.customer_phone,
      order.delivery_city,
      ...(order.store_order_items ?? []).map((item) => item.product_name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedSearch || searchable.includes(normalizedSearch);

    return (
      matchesStatus &&
      matchesPayment &&
      matchesDelivery &&
      matchesCrm &&
      matchesSearch
    );
  });

  const totalOrders = orderList.length;
  const pendingPaymentCount = orderList.filter(
    (order) => order.status === "pending_payment"
  ).length;
  const paidCount = orderList.filter(
    (order) => order.payment_status === "paid"
  ).length;
  const preparingCount = orderList.filter(
    (order) => order.status === "preparing"
  ).length;
  const readyCount = orderList.filter(
    (order) => order.status === "ready"
  ).length;
  const completedCount = orderList.filter(
    (order) => order.status === "completed"
  ).length;

  const completedRevenue = orderList
    .filter(
      (order) => order.status === "completed" || order.status === "delivered"
    )
    .reduce((acc, order) => acc + Number(order.total_cop ?? 0), 0);

  const hasFilters =
    Boolean(searchQuery || focusOrderId) ||
    selectedStatus !== "todos" ||
    selectedPayment !== "todos" ||
    selectedDelivery !== "todos" ||
    selectedCrm !== "todos";

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

          <div className="mt-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/35">
                Administración
              </p>

              <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-7xl">
                Pedidos
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
                Gestiona las compras de la tienda desde una bandeja compacta.
                Cada pedido conserva productos, variantes, pago, inventario,
                entrega, mensajes y seguimiento CRM en una vista dedicada.
              </p>
            </div>

            <div className="premium-card min-w-[230px] rounded-[1.5rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                Ingresos cerrados
              </p>

              <p className="mt-2 text-2xl font-bold sm:text-3xl">
                {formatCOP(completedRevenue)}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Pedidos" value={totalOrders} />
            <StatCard label="Pend. pago" value={pendingPaymentCount} tone="yellow" />
            <StatCard label="Pagados" value={paidCount} tone="green" />
            <StatCard label="Preparando" value={preparingCount} tone="blue" />
            <StatCard label="Listos" value={readyCount} tone="purple" />
            <StatCard label="Finalizados" value={completedCount} />
          </div>

          <div className="mt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                  Pedidos de tienda
                </h2>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  Mostrando {filteredOrders.length} de {totalOrders} pedidos.
                </p>
              </div>

              {hasFilters && (
                <Link
                  href="/admin/pedidos"
                  className="inline-flex w-fit rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-300 transition hover:border-red-400/40"
                >
                  Limpiar filtros
                </Link>
              )}
            </div>

            <form className="premium-card mt-6 rounded-[1.5rem] p-4 sm:p-5">
              <div className="grid gap-4 xl:grid-cols-[1.3fr_190px_180px_180px_180px_auto] xl:items-end">
                <AdminField label="Buscar">
                  <input
                    name="q"
                    defaultValue={searchQuery || focusOrderId}
                    placeholder="Cliente, código o producto..."
                    className="min-h-[2.85rem] w-full rounded-[0.9rem] border border-white/10 bg-white/[0.035] px-3.5 py-3 text-white outline-none placeholder:text-white/30 focus:border-white/40"
                  />
                </AdminField>

                <AdminField label="Estado del pedido">
                  <AdminStoreDropdown
                    name="status"
                    defaultValue={selectedStatus}
                    options={orderStatusOptions}
                  />
                </AdminField>

                <AdminField label="Pago">
                  <AdminStoreDropdown
                    name="payment"
                    defaultValue={selectedPayment}
                    options={paymentStatusOptions}
                  />
                </AdminField>

                <AdminField label="Entrega">
                  <AdminStoreDropdown
                    name="delivery"
                    defaultValue={selectedDelivery}
                    options={deliveryStatusOptions}
                  />
                </AdminField>

                <AdminField label="Seguimiento CRM">
                  <AdminStoreDropdown
                    name="crm"
                    defaultValue={selectedCrm}
                    options={crmOptions}
                  />
                </AdminField>

                <button
                  type="submit"
                  className="min-h-12 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                >
                  Filtrar
                </button>
              </div>
            </form>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-neutral-950">
              <div className="hidden grid-cols-[minmax(190px,1fr)_minmax(145px,0.8fr)_minmax(190px,1fr)_125px_120px_130px_110px] gap-4 border-b border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-white/30 xl:grid">
                <span>Pedido</span>
                <span>Cliente</span>
                <span>Productos</span>
                <span>Total</span>
                <span>Pago</span>
                <span>Estado</span>
                <span className="text-right">Acción</span>
              </div>

              {filteredOrders.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {filteredOrders.map((order) => {
                    const linkedFollowup = followupsByOrderId.get(order.id);
                    const items = order.store_order_items ?? [];
                    const totalUnits = items.reduce(
                      (sum, item) => sum + Number(item.quantity ?? 0),
                      0
                    );
                    const previewNames = items
                      .slice(0, 2)
                      .map((item) => item.product_name)
                      .join(" · ");

                    return (
                      <div
                        key={order.id}
                        id={`order-${order.id}`}
                        className="group grid gap-4 px-4 py-4 transition hover:bg-white/[0.025] sm:px-5 xl:grid-cols-[minmax(190px,1fr)_minmax(145px,0.8fr)_minmax(190px,1fr)_125px_120px_130px_110px] xl:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold tracking-[-0.02em]">
                            {order.order_code || order.id}
                          </p>

                          <p className="mt-1 text-xs text-white/35">
                            {formatDateTime(order.created_at)}
                          </p>

                          <p className="mt-2 text-[10px] text-white/30">
                            Entrega: {getDeliveryStatusLabel(order.delivery_status)}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm text-white/75">
                            {order.customer_name}
                          </p>

                          <p className="mt-1 truncate text-xs text-white/35">
                            {order.customer_phone || "Sin WhatsApp"}
                          </p>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm text-white/70">
                            {previewNames || "Sin productos"}
                            {items.length > 2 ? ` · +${items.length - 2}` : ""}
                          </p>

                          <p className="mt-1 text-xs text-white/35">
                            {items.length} {items.length === 1 ? "línea" : "líneas"} ·{" "}
                            {totalUnits} {totalUnits === 1 ? "unidad" : "unidades"}
                          </p>

                          {linkedFollowup ? (
                            <span className="mt-2 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-200">
                              CRM ·{" "}
                              {customerFollowupStatusLabels[linkedFollowup.status] ??
                                linkedFollowup.status}
                            </span>
                          ) : (
                            <span className="mt-2 inline-flex text-[10px] text-white/25">
                              Sin seguimiento CRM
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="whitespace-nowrap font-semibold">
                            {formatCOP(order.total_cop)}
                          </p>

                          <p className="mt-1 text-xs text-white/35">
                            {order.delivery_type === "delivery"
                              ? order.delivery_city || "Domicilio"
                              : "Recoger / coordinar"}
                          </p>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs ${getPaymentClass(
                              order.payment_status
                            )}`}
                          >
                            {getPaymentStatusLabel(order.payment_status)}
                          </span>
                        </div>

                        <div>
                          <span
                            className={`inline-flex rounded-full border px-3 py-1.5 text-xs ${getStatusClass(
                              order.status
                            )}`}
                          >
                            {getOrderStatusLabel(order.status)}
                          </span>
                        </div>

                        <div className="xl:text-right">
                          <Link
                            href={`/admin/pedidos/${order.id}`}
                            className="inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/35 hover:bg-white hover:text-black"
                          >
                            Abrir →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 text-center text-white/45">
                  No hay pedidos que coincidan con estos filtros.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  tone = "white",
}: {
  label: string;
  value: number;
  tone?: "white" | "yellow" | "green" | "purple" | "blue";
}) {
  const toneClass =
    tone === "yellow"
      ? "text-yellow-400"
      : tone === "green"
      ? "text-green-400"
      : tone === "purple"
      ? "text-purple-300"
      : tone === "blue"
      ? "text-cyan-300"
      : "text-white";

  return (
    <div className="premium-card rounded-[1.25rem] p-4 sm:rounded-[1.5rem] sm:p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>

      <p className={`mt-3 text-2xl font-bold sm:text-3xl ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function AdminField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/35">
        {label}
      </span>
      {children}
    </label>
  );
}
