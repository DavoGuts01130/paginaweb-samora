import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Cotizaciones | Admin Samora",
  description: "Centro de gestión de solicitudes de servicios de Samora Estudio.",
};

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    servicio?: string;
    crm?: string;
    focus?: string;
  }>;
};

type QuoteRow = {
  id: string;
  quote_code: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  service_type: string;
  service_label: string;
  event_date: string | null;
  service_location: string | null;
  requires_travel_review: boolean | null;
  status: string;
  meeting_status: string | null;
  final_price_cop: number | null;
  reservation_status: string | null;
  created_at: string;
};

type FollowupRow = {
  id: string;
  related_id: string | null;
  status: string;
  priority: string;
  updated_at: string | null;
};

const statusOptions = [
  { value: "all", label: "Todos los estados" },
  { value: "new", label: "Nueva" },
  { value: "new_travel_review", label: "Revisión desplazamiento" },
  { value: "reviewing", label: "En revisión" },
  { value: "proposal_sent", label: "Propuesta enviada" },
  { value: "approved", label: "Aprobada" },
  { value: "reserved", label: "Reservada" },
  { value: "completed", label: "Finalizada" },
  { value: "cancelled", label: "Cancelada" },
  { value: "scheduled", label: "Agendada" },
  { value: "rejected", label: "Rechazada" },
];

const statusLabels: Record<string, string> = {
  new: "Nueva",
  new_travel_review: "Revisión desplazamiento",
  reviewing: "En revisión",
  proposal_sent: "Propuesta enviada",
  approved: "Aprobada",
  reserved: "Reservada",
  completed: "Finalizada",
  cancelled: "Cancelada",
  scheduled: "Agendada",
  rejected: "Rechazada",
};

const meetingStatusLabels: Record<string, string> = {
  pendiente_programar: "Pendiente",
  programada: "Programada",
  realizada: "Realizada",
  no_requerida: "No requerida",
  cancelada: "Cancelada",
};

const crmStatusLabels: Record<string, string> = {
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

const inputClass =
  "min-h-12 w-full rounded-[0.9rem] border border-white/10 bg-black px-4 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-white/40 md:text-sm";

function formatCOP(value: number | null | undefined) {
  if (!value || value <= 0) return "Sin valor final";

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "Por definir";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusClass(status: string) {
  if (status === "reserved" || status === "completed") {
    return "border-emerald-400/25 bg-emerald-400/10 text-emerald-200";
  }

  if (status === "approved" || status === "proposal_sent") {
    return "border-blue-400/25 bg-blue-400/10 text-blue-200";
  }

  if (status === "new_travel_review") {
    return "border-yellow-400/25 bg-yellow-400/10 text-yellow-200";
  }

  if (status === "cancelled" || status === "rejected") {
    return "border-red-400/25 bg-red-400/10 text-red-200";
  }

  return "border-white/15 bg-white/[0.05] text-white/65";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

async function getAdminSupabase() {
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

  return supabase;
}

export default async function AdminCotizacionesPage({ searchParams }: Props) {
  const params = await searchParams;

  const selectedStatus = params.status ?? "all";
  const selectedService = params.servicio ?? "";
  const selectedCrm = params.crm ?? "all";
  const focus = params.focus?.trim() ?? "";
  const search = (params.q ?? "").trim();

  const supabase = await getAdminSupabase();

  if (focus) {
    const focusQuery = supabase
      .from("quote_requests")
      .select("id, quote_code")
      .limit(1);

    const { data: focusedQuote } = isUuid(focus)
      ? await focusQuery.eq("id", focus).maybeSingle()
      : await focusQuery.eq("quote_code", focus).maybeSingle();

    if (focusedQuote?.id) {
      redirect(`/admin/cotizaciones/${focusedQuote.id}?source=crm`);
    }
  }

  const { data: quotes, error } = await supabase
    .from("quote_requests")
    .select(
      `
      id,
      quote_code,
      customer_name,
      customer_phone,
      customer_email,
      service_type,
      service_label,
      event_date,
      service_location,
      requires_travel_review,
      status,
      meeting_status,
      final_price_cop,
      reservation_status,
      created_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(150);

  const quoteList = (quotes ?? []) as QuoteRow[];

  let followupList: FollowupRow[] = [];

  if (quoteList.length > 0) {
    const { data: followups } = await supabase
      .from("customer_followups")
      .select("id, related_id, status, priority, updated_at")
      .eq("related_type", "quote_request")
      .in(
        "related_id",
        quoteList.map((quote) => quote.id)
      );

    followupList = (followups ?? []) as FollowupRow[];
  }

  const followupsByQuoteId = new Map(
    followupList
      .filter((followup) => Boolean(followup.related_id))
      .map((followup) => [followup.related_id as string, followup])
  );

  const serviceOptions = Array.from(
    new Map(
      quoteList.map((quote) => [
        quote.service_type,
        { value: quote.service_type, label: quote.service_label },
      ])
    ).values()
  ).sort((a, b) => a.label.localeCompare(b.label, "es"));

  const normalizedSearch = (search || focus).toLowerCase();

  const filteredQuotes = quoteList.filter((quote) => {
    const followup = followupsByQuoteId.get(quote.id);

    const matchesStatus =
      selectedStatus === "all" || quote.status === selectedStatus;

    const matchesService =
      !selectedService || quote.service_type === selectedService;

    const matchesCrm =
      selectedCrm === "all" ||
      (selectedCrm === "with" && Boolean(followup)) ||
      (selectedCrm === "without" && !followup);

    const searchable = [
      quote.quote_code,
      quote.customer_name,
      quote.customer_phone,
      quote.customer_email,
      quote.service_label,
      quote.service_location,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedSearch || searchable.includes(normalizedSearch);

    return matchesStatus && matchesService && matchesCrm && matchesSearch;
  });

  const total = quoteList.length;
  const news = quoteList.filter(
    (quote) => quote.status === "new" || quote.status === "new_travel_review"
  ).length;
  const reviewing = quoteList.filter(
    (quote) => quote.status === "reviewing"
  ).length;
  const proposals = quoteList.filter(
    (quote) => quote.status === "proposal_sent"
  ).length;
  const approved = quoteList.filter(
    (quote) => quote.status === "approved"
  ).length;
  const reserved = quoteList.filter(
    (quote) =>
      quote.status === "reserved" || quote.reservation_status === "reserved"
  ).length;

  const hasFilters =
    Boolean(search || focus) ||
    selectedStatus !== "all" ||
    Boolean(selectedService) ||
    selectedCrm !== "all";

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

          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.35em] text-white/35">
              Administración
            </p>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl md:text-7xl">
              Cotizaciones
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/50 sm:text-base">
              Gestiona las solicitudes de servicios desde una bandeja comercial.
              Cada cotización conserva su proceso completo en una vista dedicada:
              cliente, reunión, propuesta, agenda, abono, reserva y seguimiento CRM.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total" value={total} />
            <StatCard label="Nuevas" value={news} tone="yellow" />
            <StatCard label="En revisión" value={reviewing} />
            <StatCard label="Propuestas" value={proposals} tone="blue" />
            <StatCard label="Aprobadas" value={approved} tone="green" />
            <StatCard label="Reservadas" value={reserved} tone="green" />
          </div>

          {error ? (
            <div className="mt-8 rounded-[1.5rem] border border-red-400/20 bg-red-400/10 p-6 text-sm leading-6 text-red-100/80">
              No se pudieron cargar las cotizaciones.
              <span className="mt-2 block text-red-100/60">
                Error: {error.message}
              </span>
            </div>
          ) : (
            <div className="mt-10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                    Solicitudes de servicio
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/45">
                    Mostrando {filteredQuotes.length} de {total} cotizaciones.
                  </p>
                </div>

                {hasFilters && (
                  <Link
                    href="/admin/cotizaciones"
                    className="inline-flex w-fit rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-300 transition hover:border-red-400/40"
                  >
                    Limpiar filtros
                  </Link>
                )}
              </div>

              <form className="premium-card mt-6 rounded-[1.5rem] p-4 sm:p-5">
                <div className="grid gap-4 xl:grid-cols-[1.25fr_190px_220px_180px_auto] xl:items-end">
                  <AdminField label="Buscar">
                    <input
                      name="q"
                      defaultValue={search || focus}
                      placeholder="Cliente, código, servicio..."
                      className={inputClass}
                    />
                  </AdminField>

                  <AdminField label="Estado">
                    <select
                      name="status"
                      defaultValue={selectedStatus}
                      className={inputClass}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </AdminField>

                  <AdminField label="Servicio">
                    <select
                      name="servicio"
                      defaultValue={selectedService}
                      className={inputClass}
                    >
                      <option value="">Todos los servicios</option>
                      {serviceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </AdminField>

                  <AdminField label="Seguimiento CRM">
                    <select
                      name="crm"
                      defaultValue={selectedCrm}
                      className={inputClass}
                    >
                      <option value="all">Todos</option>
                      <option value="with">Con seguimiento</option>
                      <option value="without">Sin seguimiento</option>
                    </select>
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
                <div className="hidden grid-cols-[minmax(195px,1fr)_minmax(145px,0.8fr)_minmax(175px,0.9fr)_125px_130px_130px_110px] gap-4 border-b border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-white/30 xl:grid">
                  <span>Cotización</span>
                  <span>Cliente</span>
                  <span>Servicio</span>
                  <span>Evento</span>
                  <span>Valor final</span>
                  <span>Estado</span>
                  <span className="text-right">Acción</span>
                </div>

                {filteredQuotes.length > 0 ? (
                  <div className="divide-y divide-white/10">
                    {filteredQuotes.map((quote) => {
                      const followup = followupsByQuoteId.get(quote.id);

                      return (
                        <div
                          key={quote.id}
                          className="group grid gap-4 px-4 py-4 transition hover:bg-white/[0.025] sm:px-5 xl:grid-cols-[minmax(195px,1fr)_minmax(145px,0.8fr)_minmax(175px,0.9fr)_125px_130px_130px_110px] xl:items-center"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold tracking-[-0.02em]">
                              {quote.quote_code}
                            </p>
                            <p className="mt-1 text-xs text-white/35">
                              {formatDateTime(quote.created_at)}
                            </p>

                            {quote.requires_travel_review && (
                              <span className="mt-2 inline-flex rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-[10px] text-yellow-200">
                                Revisar desplazamiento
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm text-white/75">
                              {quote.customer_name || "Cliente sin nombre"}
                            </p>
                            <p className="mt-1 truncate text-xs text-white/35">
                              {quote.customer_phone || "Sin WhatsApp"}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm text-white/70">
                              {quote.service_label}
                            </p>
                            <p className="mt-1 truncate text-xs text-white/35">
                              {quote.service_location || "Lugar por definir"}
                            </p>
                          </div>

                          <div>
                            <p className="text-sm text-white/70">
                              {formatDateOnly(quote.event_date)}
                            </p>
                            <p className="mt-1 text-xs text-white/35">
                              Reunión:{" "}
                              {meetingStatusLabels[
                                quote.meeting_status ?? "pendiente_programar"
                              ] ?? "Pendiente"}
                            </p>
                          </div>

                          <div>
                            <p
                              className={`whitespace-nowrap text-sm ${
                                quote.final_price_cop
                                  ? "font-semibold text-white"
                                  : "text-white/35"
                              }`}
                            >
                              {formatCOP(quote.final_price_cop)}
                            </p>

                            {followup ? (
                              <span className="mt-2 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-200">
                                CRM ·{" "}
                                {crmStatusLabels[followup.status] ??
                                  followup.status}
                              </span>
                            ) : (
                              <span className="mt-2 inline-flex text-[10px] text-white/25">
                                Sin seguimiento CRM
                              </span>
                            )}
                          </div>

                          <div>
                            <span
                              className={`inline-flex rounded-full border px-3 py-1.5 text-xs ${getStatusClass(
                                quote.status
                              )}`}
                            >
                              {statusLabels[quote.status] ?? quote.status}
                            </span>

                            {quote.reservation_status === "reserved" &&
                              quote.status !== "reserved" && (
                                <span className="mt-2 block text-[10px] text-emerald-300/70">
                                  Reserva confirmada
                                </span>
                              )}
                          </div>

                          <div className="xl:text-right">
                            <Link
                              href={`/admin/cotizaciones/${quote.id}`}
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
                    No hay cotizaciones que coincidan con estos filtros.
                  </div>
                )}
              </div>
            </div>
          )}
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
  tone?: "white" | "yellow" | "green" | "blue";
}) {
  const toneClass =
    tone === "yellow"
      ? "text-yellow-400"
      : tone === "green"
      ? "text-emerald-300"
      : tone === "blue"
      ? "text-blue-300"
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
