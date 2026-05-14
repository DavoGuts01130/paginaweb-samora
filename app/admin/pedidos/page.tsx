import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import UpdateOrderStatus from "@/components/UpdateOrderStatus";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    status?: string;
    q?: string;
  }>;
};

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
};

const statusFilters = [
  { key: "todos", label: "Todos" },
  { key: "pendiente", label: "Pendientes" },
  { key: "en proceso", label: "En proceso" },
  { key: "entregado", label: "Entregados" },
  { key: "cancelado", label: "Cancelados" },
];

function getStatusClass(status: string) {
  if (status === "pendiente") return "border-yellow-400/30 bg-yellow-400/10";
  if (status === "en proceso") return "border-blue-400/30 bg-blue-400/10";
  if (status === "entregado") return "border-green-400/30 bg-green-400/10";
  if (status === "cancelado") return "border-red-400/30 bg-red-400/10";
  return "border-white/10 bg-white/[0.03]";
}

export default async function AdminPedidosPage({ searchParams }: Props) {
  const params = await searchParams;

  const selectedStatus = params.status ?? "todos";
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
    .from("orders")
    .select(`
      *,
      order_items (
        id,
        name,
        price,
        quantity,
        image_url
      )
    `)
    .order("created_at", { ascending: false });

  if (selectedStatus !== "todos") {
    ordersQuery = ordersQuery.eq("status", selectedStatus);
  }

  if (searchQuery.trim()) {
    ordersQuery = ordersQuery.or(
      `customer_name.ilike.%${searchQuery}%,customer_email.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%,order_code.ilike.%${searchQuery}%`
    );
  }

  const { data: orders } = await ordersQuery;

  const { data: allOrdersForStats } = await supabase
    .from("orders")
    .select("status,total");

  const totalOrders = allOrdersForStats?.length ?? 0;
  const pendingCount =
    allOrdersForStats?.filter((order) => order.status === "pendiente").length ??
    0;
  const processCount =
    allOrdersForStats?.filter((order) => order.status === "en proceso").length ??
    0;
  const deliveredCount =
    allOrdersForStats?.filter((order) => order.status === "entregado").length ??
    0;
  const cancelledCount =
    allOrdersForStats?.filter((order) => order.status === "cancelado").length ??
    0;

  const deliveredRevenue =
    allOrdersForStats
      ?.filter((order) => order.status === "entregado")
      .reduce((acc, order) => acc + Number(order.total ?? 0), 0) ?? 0;

  const statusCountMap: Record<string, number> = {
    todos: totalOrders,
    pendiente: pendingCount,
    "en proceso": processCount,
    entregado: deliveredCount,
    cancelado: cancelledCount,
  };

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
                Gestiona compras, estados, entregas y seguimiento desde un panel
                centralizado.
              </p>
            </div>

            <div className="premium-card rounded-[1.5rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                Ingresos entregados
              </p>

              <p className="mt-2 text-2xl font-bold sm:text-3xl">
                ${deliveredRevenue.toLocaleString("es-CO")}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Todos" value={totalOrders} />
            <StatCard label="Pendientes" value={pendingCount} tone="yellow" />
            <StatCard label="En proceso" value={processCount} tone="blue" />
            <StatCard label="Entregados" value={deliveredCount} tone="green" />
          </div>

          <form className="premium-card mt-8 grid gap-4 rounded-[1.5rem] p-4 sm:p-5 md:grid-cols-[1fr_220px_auto]">
            <input
              name="q"
              defaultValue={searchQuery}
              placeholder="Buscar por cliente, correo, teléfono o código"
              className="min-h-12 rounded-xl border border-white/10 bg-black px-4 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-white/40 md:text-sm"
            />

            <select
              name="status"
              defaultValue={selectedStatus}
              aria-label="Filtrar por estado"
              className="min-h-12 rounded-xl border border-white/10 bg-black px-4 py-3 text-base text-white outline-none focus:border-white/40 md:text-sm"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en proceso">En proceso</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <button
              type="submit"
              className="premium-button min-h-12 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
            >
              Filtrar
            </button>
          </form>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
            {statusFilters.map((filter) => {
              const active = selectedStatus === filter.key;

              return (
                <Link
                  key={filter.key}
                  href={
                    searchQuery
                      ? `/admin/pedidos?status=${filter.key}&q=${encodeURIComponent(
                          searchQuery
                        )}`
                      : `/admin/pedidos?status=${filter.key}`
                  }
                  className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {filter.label} · {statusCountMap[filter.key] ?? 0}
                </Link>
              );
            })}

            {(selectedStatus !== "todos" || searchQuery) && (
              <Link
                href="/admin/pedidos"
                className="shrink-0 rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-300 transition hover:border-red-400/40"
              >
                Limpiar filtros
              </Link>
            )}
          </div>

          <div className="mt-8 space-y-6">
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <article
                  key={order.id}
                  className={`premium-card rounded-[1.5rem] p-4 transition hover:border-white/20 sm:p-6 ${getStatusClass(
                    order.status
                  )}`}
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
                        {new Date(order.created_at).toLocaleString("es-CO")}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <OrderStatusBadge status={order.status} />

                      {order.order_code && (
                        <Link
                          href={`/seguimiento?code=${order.order_code}`}
                          target="_blank"
                          className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/60 transition hover:bg-white hover:text-black"
                        >
                          Ver seguimiento →
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-3">
                    <InfoBlock
                      title="Cliente"
                      items={[
                        ["Nombre", order.customer_name],
                        ["Correo", order.customer_email],
                        ["Teléfono", order.customer_phone],
                      ]}
                    />

                    <InfoBlock
                      title="Envío"
                      items={[
                        ["Departamento", order.department || "Sin departamento"],
                        ["Ciudad / Municipio", order.city || "Sin ciudad"],
                        ["Dirección", order.address || "Sin dirección"],
                        ...(order.reference
                          ? [["Referencia", order.reference] as [string, string]]
                          : []),
                      ]}
                    />

                    <div className="rounded-2xl border border-white/10 bg-black p-4 lg:text-right">
                      <p className="text-sm text-white/40">Total</p>

                      <p className="mt-1 text-2xl font-bold sm:text-3xl">
                        ${Number(order.total).toLocaleString("es-CO")}
                      </p>

                      <p className="mt-4 text-sm text-white/40">
                        Estado actual
                      </p>

                      <div className="mt-2 flex justify-start lg:justify-end">
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black p-4">
                    <div className="mb-4">
                      <p className="text-sm font-medium">
                        Cambiar estado del pedido
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/35">
                        Al cambiar el estado, se enviará una notificación al
                        cliente.
                      </p>
                    </div>

                    <UpdateOrderStatus
                      orderId={order.id}
                      currentStatus={order.status}
                    />
                  </div>

                  {order.notes && (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-black p-4">
                      <p className="text-sm text-white/40">Notas del pedido</p>
                      <p className="mt-2 break-words text-white/70">
                        {order.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                    <p className="text-sm uppercase tracking-[0.25em] text-white/30">
                      Productos
                    </p>

                    {order.order_items && order.order_items.length > 0 ? (
                      order.order_items.map((item: OrderItem) => (
                        <div
                          key={item.id}
                          className="flex gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0"
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

function StatCard({
  label,
  value,
  tone = "white",
}: {
  label: string;
  value: number;
  tone?: "white" | "yellow" | "blue" | "green";
}) {
  const toneClass =
    tone === "yellow"
      ? "text-yellow-400"
      : tone === "blue"
      ? "text-blue-400"
      : tone === "green"
      ? "text-green-400"
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

function InfoBlock({
  title,
  items,
}: {
  title: string;
  items: [string, string][];
}) {
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