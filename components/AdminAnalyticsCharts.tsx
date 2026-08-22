"use client";

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

type DailyTraffic = {
  date: string;
  label: string;
  visitas: number;
  cotizaciones: number;
  whatsapp: number;
};

type ActionChartItem = {
  label: string;
  total: number;
};

type Props = {
  dailyTraffic: DailyTraffic[];
  actionChartData: ActionChartItem[];
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

export default function AdminAnalyticsCharts({
  dailyTraffic,
  actionChartData,
}: Props) {
  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <ChartCard
        title="Tendencia últimos 7 días"
        description="Visitas, clics en cotización y clics en WhatsApp por día."
      >
        <div className="h-[280px] w-full min-w-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailyTraffic}
              margin={{ top: 10, right: 8, left: -18, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id="analyticsVisitsGlow"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.35)"
                tickLine={false}
                axisLine={false}
                fontSize={11}
              />

              <YAxis
                stroke="rgba(255,255,255,0.35)"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                allowDecimals={false}
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
                formatter={(value, name) => [
                  formatNumber(Number(value)),
                  name === "visitas"
                    ? "Visitas"
                    : name === "cotizaciones"
                      ? "Cotizaciones"
                      : "WhatsApp",
                ]}
              />

              <Area
                type="monotone"
                dataKey="visitas"
                stroke="#ffffff"
                strokeWidth={2}
                fill="url(#analyticsVisitsGlow)"
                dot={false}
                activeDot={{
                  r: 4,
                  stroke: "#ffffff",
                  strokeWidth: 2,
                  fill: "#000000",
                }}
              />

              <Area
                type="monotone"
                dataKey="cotizaciones"
                stroke="#facc15"
                strokeWidth={2}
                fill="transparent"
                dot={false}
                activeDot={{
                  r: 4,
                  stroke: "#facc15",
                  strokeWidth: 2,
                  fill: "#000000",
                }}
              />

              <Area
                type="monotone"
                dataKey="whatsapp"
                stroke="#4ade80"
                strokeWidth={2}
                fill="transparent"
                dot={false}
                activeDot={{
                  r: 4,
                  stroke: "#4ade80",
                  strokeWidth: 2,
                  fill: "#000000",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/45">
          <LegendDot label="Visitas" className="bg-white" />
          <LegendDot label="Cotización" className="bg-yellow-300" />
          <LegendDot label="WhatsApp" className="bg-green-400" />
        </div>
      </ChartCard>

      <ChartCard
        title="Acciones importantes"
        description="Eventos comerciales registrados en los últimos 7 días."
      >
        {actionChartData.length > 0 ? (
          <div className="h-[280px] w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={actionChartData}
                layout="vertical"
                margin={{ top: 5, right: 8, left: 8, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  stroke="rgba(255,255,255,0.35)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  allowDecimals={false}
                />

                <YAxis
                  type="category"
                  dataKey="label"
                  stroke="rgba(255,255,255,0.35)"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={112}
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
                  formatter={(value) => [
                    formatNumber(Number(value)),
                    "Eventos",
                  ]}
                />

                <Bar
                  dataKey="total"
                  fill="#ffffff"
                  radius={[0, 10, 10, 0]}
                  isAnimationActive
                  animationDuration={900}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/35 p-6 text-center text-sm leading-6 text-white/40">
            Aún no hay acciones comerciales registradas. Cuando conectemos los
            clics de WhatsApp, cotización, tienda y seguimiento, aparecerán aquí.
          </div>
        )}
      </ChartCard>
    </section>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-5 border-b border-white/10 pb-5">
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>
      </div>

      {children}
    </section>
  );
}

function LegendDot({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}