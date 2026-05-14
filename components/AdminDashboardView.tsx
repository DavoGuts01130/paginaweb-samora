"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RecentProject = {
  id: string;
  title: string;
  created_at: string;
  categoryName: string;
};

type CategoryStats = {
  id: string;
  name: string;
  count: number;
};

type SalesByDay = {
  date: string;
  total: number;
};

type SalesByMonth = {
  month: string;
  total: number;
};

type TopProduct = {
  name: string;
  units: number;
  revenue: number;
};

type StatusStat = {
  label: string;
  value: number;
  status: string;
};

type RecentOrder = {
  id: string;
  order_code: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
};

type LowStockProduct = {
  id: string;
  name: string;
  stock: number;
  price: number;
};

type Props = {
  projectsCount: number;
  imagesCount: number;
  categoriesCount: number;
  ordersCount: number;
  pendingOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  monthGrowth: number;
  todayGrowth: number;
  averageTicket: number;
  salesByDay: SalesByDay[];
  salesByMonth: SalesByMonth[];
  topProducts: TopProduct[];
  recentProjects: RecentProject[];
  projectsByCategory: CategoryStats[];
  statusStats: StatusStat[];
  recentOrders: RecentOrder[];
  lowStockProducts: LowStockProduct[];
  selectedRange: string;
};

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const ranges = [
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "year", label: "Año" },
  { key: "all", label: "Todo" },
];

const quickLinks = [
  {
    title: "Portafolio",
    description: "Gestiona proyectos, portadas e imágenes.",
    href: "/admin/portafolio",
    label: "Visual",
  },
  {
    title: "Productos",
    description: "Administra catálogo, stock y precios.",
    href: "/admin/productos",
    label: "Tienda",
  },
  {
    title: "Pedidos",
    description: "Revisa ventas, estados y entregas.",
    href: "/admin/pedidos",
    label: "Ventas",
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });
}

function formatMonth(value: string) {
  const [year, month] = value.split("-");

  return new Date(Number(year), Number(month) - 1).toLocaleDateString("es-CO", {
    month: "short",
    year: "2-digit",
  });
}

function getStatusColor(status: string) {
  if (status === "pendiente") return "text-yellow-400";
  if (status === "en proceso") return "text-blue-400";
  if (status === "entregado") return "text-green-400";
  if (status === "cancelado") return "text-red-400";
  return "text-white";
}

export default function AdminDashboardView({
  projectsCount,
  imagesCount,
  categoriesCount,
  ordersCount,
  pendingOrders,
  totalRevenue,
  todayRevenue,
  monthRevenue,
  yearRevenue,
  monthGrowth,
  todayGrowth,
  averageTicket,
  salesByDay,
  salesByMonth,
  topProducts,
  recentProjects,
  projectsByCategory,
  statusStats,
  recentOrders,
  lowStockProducts,
  selectedRange,
}: Props) {
  const maxCategory = Math.max(
    ...projectsByCategory.map((category) => category.count),
    1
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-black pt-24 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-160px] top-[-160px] h-[420px] w-[420px] rounded-full bg-white/[0.06] blur-[150px]" />
        <div className="absolute right-[-140px] top-[35%] h-[380px] w-[380px] rounded-full bg-blue-500/[0.06] blur-[150px]" />
        <div className="absolute bottom-[-150px] left-[30%] h-[420px] w-[420px] rounded-full bg-purple-500/[0.055] blur-[160px]" />
      </div>

      <section className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55 }}
          className="grid min-w-0 gap-6 lg:grid-cols-[1fr_auto] lg:items-end"
        >
          <div className="min-w-0">
            <p className="text-sm uppercase tracking-[0.35em] text-white/30 sm:tracking-[0.4em]">
              Dashboard
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.05em] sm:text-5xl md:text-7xl">
              Panel de control
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-white/50 md:text-lg md:leading-8">
              Gestiona ventas, pedidos, contenido, productos y rendimiento desde
              un solo lugar.
            </p>
          </div>

          <div className="flex w-full gap-2 overflow-x-auto rounded-full border border-white/10 bg-white/[0.025] p-1 lg:w-auto lg:flex-wrap lg:gap-3 lg:overflow-visible">
            {ranges.map((range) => (
              <Link
                key={range.key}
                href={`/admin?range=${range.key}`}
                className={`shrink-0 rounded-full px-4 py-2 text-sm transition ${
                  selectedRange === range.key
                    ? "bg-white text-black"
                    : "text-white/50 hover:bg-white/10 hover:text-white"
                }`}
              >
                {range.label}
              </Link>
            ))}
          </div>
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Ingresos"
            value={currency.format(totalRevenue)}
            label="Ventas entregadas"
            delay={0}
            featured
          />

          <MetricCard
            title="Ticket promedio"
            value={currency.format(averageTicket)}
            label="Promedio por venta"
            delay={0.08}
          />

          <MetricCard
            title="Pedidos"
            value={ordersCount}
            label="Pedidos registrados"
            delay={0.16}
          />

          <MetricCard
            title="Pendientes"
            value={pendingOrders}
            label="Requieren revisión"
            delay={0.24}
            warning
          />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Ventas hoy"
            value={currency.format(todayRevenue)}
            label="Comparado con ayer"
            delay={0.3}
            growth={todayGrowth}
          />

          <MetricCard
            title="Ventas mes"
            value={currency.format(monthRevenue)}
            label="Comparado con mes anterior"
            delay={0.38}
            growth={monthGrowth}
          />

          <MetricCard
            title="Ventas año"
            value={currency.format(yearRevenue)}
            label="Acumulado anual"
            delay={0.46}
          />
        </div>

        <div className="mt-10 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Panel
            eyebrow="Rendimiento"
            title="Ventas por día"
            description="Evolución de ingresos entregados en el rango seleccionado."
            delay={0.52}
          >
            {salesByDay.length > 0 ? (
              <div className="h-[280px] w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={salesByDay}
                    margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="salesGlow"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#ffffff"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ffffff"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="date"
                      stroke="rgba(255,255,255,0.35)"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tickFormatter={formatDate}
                    />

                    <YAxis
                      stroke="rgba(255,255,255,0.35)"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tickFormatter={(value) =>
                        `$${Number(value).toLocaleString("es-CO")}`
                      }
                    />

                    <Tooltip
                      cursor={{ stroke: "rgba(255,255,255,0.12)" }}
                      contentStyle={{
                        background: "#050505",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "18px",
                        color: "#fff",
                        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
                      }}
                      labelFormatter={(value) => formatDate(String(value))}
                      formatter={(value) => [
                        currency.format(Number(value)),
                        "Ventas",
                      ]}
                    />

                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#ffffff"
                      strokeWidth={2}
                      fill="url(#salesGlow)"
                      dot={false}
                      activeDot={{
                        r: 4,
                        stroke: "#ffffff",
                        strokeWidth: 2,
                        fill: "#000000",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text="Aún no hay ventas entregadas para graficar." />
            )}
          </Panel>

          <Panel
            eyebrow="Pedidos"
            title="Estado de pedidos"
            description="Distribución general de pedidos por estado."
            delay={0.6}
          >
            <div className="space-y-4">
              {statusStats.map((item) => (
                <div
                  key={item.status}
                  className="rounded-2xl border border-white/10 bg-black p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-white/60">{item.label}</span>
                    <span className={`font-bold ${getStatusColor(item.status)}`}>
                      {item.value}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          ordersCount === 0
                            ? 0
                            : (item.value / ordersCount) * 100
                        }%`,
                      }}
                      transition={{ duration: 0.8 }}
                      className="h-full rounded-full bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="mt-10 grid min-w-0 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel
            eyebrow="Resumen"
            title="Ventas por mes"
            description="Vista mensual de ingresos entregados."
            delay={0.68}
          >
            {salesByMonth.length > 0 ? (
              <div className="h-[260px] w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={salesByMonth}
                    margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
                  >
                    <CartesianGrid
                      stroke="rgba(255,255,255,0.06)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="month"
                      stroke="rgba(255,255,255,0.35)"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tickFormatter={formatMonth}
                    />

                    <YAxis
                      stroke="rgba(255,255,255,0.35)"
                      tickLine={false}
                      axisLine={false}
                      fontSize={11}
                      tickFormatter={(value) =>
                        `$${Number(value).toLocaleString("es-CO")}`
                      }
                    />

                    <Tooltip
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      contentStyle={{
                        background: "#050505",
                        border: "1px solid rgba(255,255,255,0.14)",
                        borderRadius: "18px",
                        color: "#fff",
                        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
                      }}
                      labelFormatter={(value) => formatMonth(String(value))}
                      formatter={(value) => [
                        currency.format(Number(value)),
                        "Ventas",
                      ]}
                    />

                    <Bar
                      dataKey="total"
                      fill="#ffffff"
                      radius={[10, 10, 0, 0]}
                      isAnimationActive
                      animationDuration={900}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text="Aún no hay ventas mensuales." />
            )}
          </Panel>

          <Panel
            eyebrow="Tienda"
            title="Productos más vendidos"
            description="Ranking de unidades vendidas e ingresos por producto."
            delay={0.76}
          >
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <motion.div
                    key={product.name}
                    whileHover={{ x: 4 }}
                    className="rounded-2xl border border-white/10 bg-black p-4 transition hover:border-white/20 hover:bg-white/[0.035]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                          #{index + 1}
                          {index === 0 && (
                            <span className="ml-2 text-yellow-400">Top</span>
                          )}
                        </p>

                        <h3 className="mt-1 truncate font-semibold">
                          {product.name}
                        </h3>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-bold">{product.units} uds</p>
                        <p className="text-sm text-white/40">
                          {currency.format(product.revenue)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <EmptyState text="Aún no hay productos vendidos." />
              )}
            </div>
          </Panel>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Panel
            eyebrow="Actividad"
            title="Pedidos recientes"
            description="Últimos movimientos registrados en la tienda."
            delay={0.84}
          >
            <div className="space-y-3">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href="/admin/pedidos"
                    className="block rounded-2xl border border-white/10 bg-black p-4 transition hover:border-white/25 hover:bg-white/[0.03]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {order.order_code}
                        </p>
                        <p className="mt-1 truncate text-sm text-white/40">
                          {order.customer_name}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-bold">
                          {currency.format(order.total)}
                        </p>
                        <p className={`text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState text="Aún no hay pedidos recientes." />
              )}
            </div>
          </Panel>

          <Panel
            eyebrow="Inventario"
            title="Alertas de stock"
            description="Productos activos con pocas unidades disponibles."
            delay={0.92}
          >
            <div className="space-y-3">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product) => (
                  <Link
                    key={product.id}
                    href="/admin/productos"
                    className="block rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.04] p-4 transition hover:border-yellow-400/35"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{product.name}</p>
                        <p className="mt-1 text-sm text-white/40">
                          {currency.format(product.price)}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-yellow-400">
                        Stock: {product.stock}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState text="No hay productos con stock bajo." />
              )}
            </div>
          </Panel>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Proyectos"
            value={projectsCount}
            label="Trabajos en portafolio"
            delay={1}
          />

          <MetricCard
            title="Imágenes"
            value={imagesCount}
            label="Archivos visuales"
            delay={1.08}
          />

          <MetricCard
            title="Categorías"
            value={categoriesCount}
            label="Colecciones activas"
            delay={1.16}
          />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Panel
            eyebrow="Contenido"
            title="Últimos proyectos"
            description="Proyectos agregados recientemente al portafolio."
            delay={1.24}
          >
            <div className="space-y-3">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    whileHover={{ x: 6 }}
                    className="flex items-center justify-between gap-4 border-b border-white/5 pb-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-white/85">{project.title}</p>
                      <p className="truncate text-xs uppercase tracking-[0.2em] text-white/30">
                        {project.categoryName}
                      </p>
                    </div>

                    <span className="shrink-0 text-white/35">
                      {new Date(project.created_at).toLocaleDateString(
                        "es-CO"
                      )}
                    </span>
                  </motion.div>
                ))
              ) : (
                <EmptyState text="Aún no hay proyectos." />
              )}
            </div>
          </Panel>

          <Panel
            eyebrow="Colecciones"
            title="Proyectos por categoría"
            description="Distribución actual del portafolio."
            delay={1.32}
          >
            <div className="space-y-5">
              {projectsByCategory.map((category) => {
                const width = `${(category.count / maxCategory) * 100}%`;

                return (
                  <div key={category.id}>
                    <div className="mb-2 flex justify-between gap-4 text-sm">
                      <span className="truncate text-white/70">
                        {category.name}
                      </span>
                      <span className="shrink-0 text-white/40">
                        {category.count}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width }}
                        transition={{ duration: 0.8, delay: 0.25 }}
                        className="h-full rounded-full bg-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="mt-10">
          <Panel
            eyebrow="Accesos"
            title="Gestión rápida"
            description="Entra directamente a las áreas principales del sistema."
            delay={1.4}
          >
            <div className="grid gap-4 md:grid-cols-3">
              {quickLinks.map((item) => (
                <QuickAccessCard key={item.title} {...item} />
              ))}
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  title,
  value,
  label,
  delay,
  featured = false,
  warning = false,
  growth,
}: {
  title: string;
  value: number | string;
  label: string;
  delay: number;
  featured?: boolean;
  warning?: boolean;
  growth?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -4 }}
      className={`premium-card min-w-0 rounded-[1.5rem] p-5 sm:p-6 ${
        featured ? "bg-white/[0.05]" : ""
      }`}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-white/35 sm:text-sm sm:tracking-[0.25em]">
        {title}
      </p>

      <h2
        className={`mt-4 break-words text-2xl font-bold tracking-[-0.04em] sm:text-3xl md:text-4xl ${
          warning ? "text-yellow-400" : "text-white"
        }`}
      >
        {value}
      </h2>

      <p className="mt-2 text-sm text-white/35">{label}</p>

      {growth !== undefined && (
        <p
          className={`mt-4 text-sm ${
            growth > 0
              ? "text-green-400"
              : growth < 0
              ? "text-red-400"
              : "text-white/40"
          }`}
        >
          {growth > 0 ? "↑" : growth < 0 ? "↓" : "•"}{" "}
          {Math.abs(growth).toFixed(1)}% vs periodo anterior
        </p>
      )}
    </motion.div>
  );
}

function QuickAccessCard({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-white/10 bg-black p-4 transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.04]"
    >
      <p className="text-xs uppercase tracking-[0.25em] text-white/30">
        {label}
      </p>

      <h3 className="mt-3 font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-5 text-white/45">{description}</p>

      <span className="mt-4 inline-block text-sm text-white/70 transition group-hover:text-white">
        Entrar →
      </span>
    </Link>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  children,
  delay,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay, duration: 0.5 }}
      className="premium-card min-w-0 overflow-hidden rounded-[1.5rem] p-4 sm:p-6"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-white/30">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-xl font-semibold">{title}</h2>

      {description && (
        <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
          {description}
        </p>
      )}

      <div className="mt-6 min-w-0">{children}</div>
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black p-6 text-center text-sm text-white/40">
      {text}
    </div>
  );
}