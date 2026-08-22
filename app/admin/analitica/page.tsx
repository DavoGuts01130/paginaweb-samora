import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AdminAnalyticsCharts from "@/components/AdminAnalyticsCharts";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Analítica",
};

type SiteEvent = {
  event_type: string;
  path: string;
  device_type: string | null;
  created_at: string;
};

type TopPage = {
  path: string;
  total_views: number;
  unique_sessions: number;
  last_view_at: string | null;
};

type Followup = {
  status: string;
  priority: string;
  next_followup_at: string | null;
  updated_at: string | null;
};

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

const eventLabels: Record<string, string> = {
  page_view: "Visitas",
  quote_click: "Clics en cotización",
  whatsapp_click: "Clics en WhatsApp",
  cart_click: "Clics en carrito",
  checkout_start: "Checkout iniciado",
  order_created: "Pedidos creados",
  tracking_search: "Búsquedas de seguimiento",
  portfolio_view: "Vistas portafolio",
  product_view: "Vistas producto",
  service_view: "Vistas servicios",
  reservation_view: "Vistas reserva",
  admin_view: "Vistas admin",
  other: "Otros eventos",
};

const followupLabels: Record<string, string> = {
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

const importantActionTypes = [
  "quote_click",
  "whatsapp_click",
  "cart_click",
  "checkout_start",
  "order_created",
  "tracking_search",
  "portfolio_view",
  "product_view",
  "service_view",
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-CO").format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(value));
}

function getColombiaDayRange() {
  const now = new Date();

  const colombiaNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);

  const year = colombiaNow.getUTCFullYear();
  const month = colombiaNow.getUTCMonth();
  const day = colombiaNow.getUTCDate();

  const todayStartUtc = new Date(Date.UTC(year, month, day, 5, 0, 0));
  const tomorrowStartUtc = new Date(Date.UTC(year, month, day + 1, 5, 0, 0));
  const sevenDaysStartUtc = new Date(Date.UTC(year, month, day - 6, 5, 0, 0));

  return {
    todayStart: todayStartUtc.toISOString(),
    tomorrowStart: tomorrowStartUtc.toISOString(),
    sevenDaysStart: sevenDaysStartUtc.toISOString(),
  };
}

function getColombiaDateKey(value: string) {
  const date = new Date(value);
  const colombiaDate = new Date(date.getTime() - 5 * 60 * 60 * 1000);

  const year = colombiaDate.getUTCFullYear();
  const month = String(colombiaDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(colombiaDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLastSevenDayBuckets() {
  const now = new Date();
  const colombiaNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);

  const year = colombiaNow.getUTCFullYear();
  const month = colombiaNow.getUTCMonth();
  const day = colombiaNow.getUTCDate();

  return Array.from({ length: 7 }, (_, index) => {
    const bucketDate = new Date(Date.UTC(year, month, day - (6 - index), 5));
    const colombiaDate = new Date(bucketDate.getTime() - 5 * 60 * 60 * 1000);

    const bucketYear = colombiaDate.getUTCFullYear();
    const bucketMonth = String(colombiaDate.getUTCMonth() + 1).padStart(2, "0");
    const bucketDay = String(colombiaDate.getUTCDate()).padStart(2, "0");

    const key = `${bucketYear}-${bucketMonth}-${bucketDay}`;

    const label = new Intl.DateTimeFormat("es-CO", {
      weekday: "short",
      day: "numeric",
      timeZone: "America/Bogota",
    }).format(bucketDate);

    return {
      date: key,
      label,
      visitas: 0,
      cotizaciones: 0,
      whatsapp: 0,
    };
  });
}

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

function getTopEntries(map: Record<string, number>, limit = 8) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

function buildDailyTraffic(events: SiteEvent[]): DailyTraffic[] {
  const buckets = getLastSevenDayBuckets();
  const map = new Map(buckets.map((bucket) => [bucket.date, bucket]));

  events.forEach((event) => {
    const key = getColombiaDateKey(event.created_at);
    const bucket = map.get(key);

    if (!bucket) return;

    if (event.event_type === "page_view") {
      bucket.visitas += 1;
    }

    if (event.event_type === "quote_click") {
      bucket.cotizaciones += 1;
    }

    if (event.event_type === "whatsapp_click") {
      bucket.whatsapp += 1;
    }
  });

  return buckets;
}

function buildActionChartData(
  eventCounts: Record<string, number>
): ActionChartItem[] {
  return importantActionTypes
    .map((type) => ({
      label: eventLabels[type] ?? type,
      total: eventCounts[type] ?? 0,
    }))
    .filter((item) => item.total > 0)
    .slice(0, 8);
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const { todayStart, tomorrowStart, sevenDaysStart } = getColombiaDayRange();

  const [
    totalEventsResult,
    totalPageViewsResult,
    todayPageViewsResult,
    lastSevenEventsResult,
    topPagesResult,
    followupsResult,
  ] = await Promise.all([
    supabase.from("site_events").select("id", { count: "exact", head: true }),

    supabase
      .from("site_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "page_view"),

    supabase
      .from("site_events")
      .select("id", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .gte("created_at", todayStart)
      .lt("created_at", tomorrowStart),

    supabase
      .from("site_events")
      .select("event_type,path,device_type,created_at")
      .gte("created_at", sevenDaysStart)
      .order("created_at", { ascending: false })
      .limit(5000),

    supabase
      .from("site_events_top_pages")
      .select("path,total_views,unique_sessions,last_view_at")
      .limit(10),

    supabase
      .from("customer_followups")
      .select("status,priority,next_followup_at,updated_at")
      .limit(5000),
  ]);

  const lastSevenEvents = (lastSevenEventsResult.data ?? []) as SiteEvent[];
  const topPages = (topPagesResult.data ?? []) as TopPage[];
  const followups = (followupsResult.data ?? []) as Followup[];

  const totalEvents = totalEventsResult.count ?? 0;
  const totalPageViews = totalPageViewsResult.count ?? 0;
  const todayPageViews = todayPageViewsResult.count ?? 0;

  const lastSevenPageViews = lastSevenEvents.filter(
    (event) => event.event_type === "page_view"
  ).length;

  const whatsappClicks = lastSevenEvents.filter(
    (event) => event.event_type === "whatsapp_click"
  ).length;

  const quoteClicks = lastSevenEvents.filter(
    (event) => event.event_type === "quote_click"
  ).length;

  const eventCounts = countBy(lastSevenEvents.map((event) => event.event_type));

  const deviceCounts = countBy(
    lastSevenEvents.map((event) => event.device_type ?? "unknown")
  );

  const followupCounts = countBy(followups.map((item) => item.status));

  const pendingFollowups = followups.filter((item) =>
    [
      "pendiente_contactar",
      "sin_respuesta",
      "esperando_cliente",
      "esperando_pago",
      "esperando_comprobante",
      "entrega_pendiente",
      "seguimiento_programado",
      "revisar_manual",
    ].includes(item.status)
  ).length;

  const urgentFollowups = followups.filter(
    (item) => item.priority === "alta" || item.priority === "urgente"
  ).length;

  const nextFollowup = followups
    .filter((item) => item.next_followup_at)
    .sort((a, b) =>
      String(a.next_followup_at).localeCompare(String(b.next_followup_at))
    )[0];

  const dailyTraffic = buildDailyTraffic(lastSevenEvents);
  const actionChartData = buildActionChartData(eventCounts);

  return (
    <main className="min-h-screen bg-black px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/35">
              Panel admin
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              Analítica y seguimiento
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50 sm:text-base sm:leading-7">
              Revisa visitas del sitio, páginas más consultadas, acciones
              importantes y señales iniciales del seguimiento comercial.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white/70 transition hover:border-white hover:bg-white hover:text-black"
          >
            Volver al panel
          </Link>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Visitas hoy"
            value={todayPageViews}
            helper="Según horario Colombia"
          />

          <MetricCard
            label="Visitas últimos 7 días"
            value={lastSevenPageViews}
            helper="Solo páginas públicas"
          />

          <MetricCard
            label="Clics en cotización"
            value={quoteClicks}
            helper="Últimos 7 días"
          />

          <MetricCard
            label="Clics en WhatsApp"
            value={whatsappClicks}
            helper="Últimos 7 días"
          />
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Visitas totales"
            value={totalPageViews}
            helper="Desde que se activó el tracker"
          />

          <MetricCard
            label="Eventos totales"
            value={totalEvents}
            helper="Visitas + acciones"
          />

          <MetricCard
            label="Seguimientos pendientes"
            value={pendingFollowups}
            helper="CRM interno"
          />

          <MetricCard
            label="Prioridad alta"
            value={urgentFollowups}
            helper={
              nextFollowup
                ? `Próximo: ${formatDate(nextFollowup.next_followup_at)}`
                : "Sin próximos seguimientos"
            }
          />
        </section>

        <AdminAnalyticsCharts
          dailyTraffic={dailyTraffic}
          actionChartData={actionChartData}
        />

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <PanelCard
            title="Páginas más visitadas"
            description="Ranking general de páginas públicas visitadas."
          >
            {topPages.length > 0 ? (
              <div className="space-y-3">
                {topPages.map((page, index) => (
                  <div
                    key={`${page.path}-${index}`}
                    className="rounded-[1.25rem] border border-white/10 bg-black/45 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {page.path}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          Última visita: {formatDate(page.last_view_at)}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-lg font-semibold text-white">
                          {formatNumber(page.total_views)}
                        </p>

                        <p className="text-xs text-white/35">
                          {formatNumber(page.unique_sessions)} sesiones
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Todavía no hay páginas registradas. Abre algunas páginas públicas para generar datos." />
            )}
          </PanelCard>

          <PanelCard
            title="Eventos últimos 7 días"
            description="Acciones registradas por el sitio."
          >
            {Object.keys(eventCounts).length > 0 ? (
              <div className="space-y-3">
                {getTopEntries(eventCounts, 10).map(([eventType, total]) => (
                  <SmallStatRow
                    key={eventType}
                    label={eventLabels[eventType] ?? eventType}
                    value={total}
                  />
                ))}
              </div>
            ) : (
              <EmptyState text="Todavía no hay eventos de los últimos 7 días." />
            )}
          </PanelCard>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <PanelCard
            title="Dispositivos"
            description="Distribución de visitas y acciones por tipo de pantalla."
          >
            {Object.keys(deviceCounts).length > 0 ? (
              <div className="space-y-3">
                {getTopEntries(deviceCounts).map(([device, total]) => (
                  <SmallStatRow
                    key={device}
                    label={
                      device === "mobile"
                        ? "Móvil"
                        : device === "tablet"
                          ? "Tablet"
                          : device === "desktop"
                            ? "Computador"
                            : "Desconocido"
                    }
                    value={total}
                  />
                ))}
              </div>
            ) : (
              <EmptyState text="Aún no hay datos de dispositivos." />
            )}
          </PanelCard>

          <PanelCard
            title="Seguimiento comercial"
            description="Resumen inicial del CRM interno."
          >
            {Object.keys(followupCounts).length > 0 ? (
              <div className="space-y-3">
                {getTopEntries(followupCounts, 10).map(([status, total]) => (
                  <SmallStatRow
                    key={status}
                    label={followupLabels[status] ?? status}
                    value={total}
                  />
                ))}
              </div>
            ) : (
              <EmptyState text="Aún no hay seguimientos creados. Después conectaremos cotizaciones, pedidos y contactos manuales." />
            )}
          </PanelCard>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-white/35">
        {label}
      </p>

      <p className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white">
        {formatNumber(value)}
      </p>

      <p className="mt-2 text-xs text-white/40">{helper}</p>
    </article>
  );
}

function PanelCard({
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

function SmallStatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/45 px-4 py-3">
      <span className="text-sm text-white/65">{label}</span>

      <span className="text-lg font-semibold text-white">
        {formatNumber(value)}
      </span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-black/35 p-5 text-sm leading-6 text-white/40">
      {text}
    </div>
  );
}