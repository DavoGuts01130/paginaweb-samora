"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CustomerFollowup } from "@/app/admin/seguimiento-clientes/page";

type StatusOption = {
  value: string;
  label: string;
};

type PriorityOption = {
  value: string;
  label: string;
};

const FOLLOWUPS_SELECT = `
  id,
  customer_name,
  customer_phone,
  customer_email,
  customer_document,
  related_type,
  related_id,
  related_code,
  source,
  status,
  priority,
  title,
  summary,
  internal_notes,
  last_contacted_at,
  next_followup_at,
  contact_attempts,
  last_channel,
  last_message_type,
  last_message_body,
  created_at,
  updated_at
`;

const statusOptions: StatusOption[] = [
  { value: "pendiente_contactar", label: "Pendiente contactar" },
  { value: "contactado", label: "Contactado" },
  { value: "sin_respuesta", label: "Sin respuesta" },
  { value: "esperando_cliente", label: "Esperando cliente" },
  { value: "esperando_pago", label: "Esperando pago" },
  { value: "esperando_comprobante", label: "Esperando comprobante" },
  { value: "entrega_pendiente", label: "Entrega pendiente" },
  { value: "seguimiento_programado", label: "Seguimiento programado" },
  { value: "revisar_manual", label: "Revisar manual" },
  { value: "cerrado", label: "Cerrado" },
  { value: "cancelado", label: "Cancelado" },
];

const priorityOptions: PriorityOption[] = [
  { value: "baja", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const originOptions = [
  { value: "todos", label: "Todos los orígenes" },
  { value: "quote_request", label: "Cotizaciones" },
  { value: "store_order", label: "Pedidos" },
  { value: "manual", label: "Manuales" },
  { value: "reservation", label: "Reservas" },
];

const sourceLabels: Record<string, string> = {
  manual: "Manual",
  quote_request: "Cotización",
  store_order: "Pedido",
  reservation: "Reserva",
  whatsapp: "WhatsApp",
  excel_import: "Excel",
  site: "Sitio web",
  other: "Otro",
};

const relatedLabels: Record<string, string> = {
  manual: "Manual",
  quote_request: "Cotización",
  store_order: "Pedido",
  reservation: "Reserva",
  whatsapp: "WhatsApp",
  excel_import: "Excel",
  other: "Otro",
};

const statusLabels = Object.fromEntries(
  statusOptions.map((item) => [item.value, item.label])
);

const priorityLabels = Object.fromEntries(
  priorityOptions.map((item) => [item.value, item.label])
);

const whatsappNumber =
  process.env.NEXT_PUBLIC_SAMORA_WHATSAPP_NUMBER ?? "573138429568";

function normalizePhone(phone: string | null) {
  if (!phone) return "";

  const digits = phone.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("57")) return digits;

  if (digits.length === 10) return `57${digits}`;

  return digits;
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  }).format(new Date(value));
}

function formatShortDate(value: string | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeZone: "America/Bogota",
  }).format(new Date(value));
}

function toDateTimeLocalValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const colombiaDate = new Date(date.getTime() - 5 * 60 * 60 * 1000);

  const year = colombiaDate.getUTCFullYear();
  const month = String(colombiaDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(colombiaDate.getUTCDate()).padStart(2, "0");
  const hours = String(colombiaDate.getUTCHours()).padStart(2, "0");
  const minutes = String(colombiaDate.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function fromDateTimeLocalValue(value: string) {
  if (!value) return null;

  const [datePart, timePart] = value.split("T");

  if (!datePart || !timePart) return null;

  const [year, month, day] = datePart.split("-").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);

  if (
    !year ||
    !month ||
    !day ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }

  const utcDate = new Date(
    Date.UTC(year, month - 1, day, hours + 5, minutes, 0)
  );

  return utcDate.toISOString();
}

function getFollowupDisplayTitle(followup: CustomerFollowup) {
  if (followup.related_type === "quote_request") {
    return "Cotización pendiente";
  }

  if (followup.related_type === "store_order") {
    return "Pedido pendiente";
  }

  if (followup.related_type === "manual") {
    return followup.title || "Seguimiento manual";
  }

  return followup.title || "Seguimiento";
}

function getFollowupOriginLabel(followup: CustomerFollowup) {
  if (followup.related_type === "quote_request") {
    return "Origen: Cotización";
  }

  if (followup.related_type === "store_order") {
    return "Origen: Pedido";
  }

  if (followup.related_type === "manual") {
    return "Origen: Manual";
  }

  return relatedLabels[followup.related_type] ?? followup.related_type;
}

function buildWhatsappMessage(followup: CustomerFollowup) {
  const name = followup.customer_name?.trim() || "cliente";

  if (followup.status === "esperando_pago") {
    return `Hola ${name}, te saludamos de Samora Estudio. Queríamos recordarte que tu solicitud aún tiene un pago pendiente. Cuando puedas, envíanos el comprobante o indícanos si necesitas que revisemos algo.`;
  }

  if (followup.status === "esperando_comprobante") {
    return `Hola ${name}, te saludamos de Samora Estudio. Estamos pendientes del comprobante para poder continuar con tu proceso. Puedes enviárnoslo por este medio cuando lo tengas disponible.`;
  }

  if (followup.status === "entrega_pendiente") {
    return `Hola ${name}, te saludamos de Samora Estudio. Queríamos confirmar contigo la entrega pendiente y coordinar los detalles para finalizar correctamente tu pedido o servicio.`;
  }

  if (followup.status === "sin_respuesta") {
    return `Hola ${name}, te saludamos de Samora Estudio. Queríamos hacer seguimiento a tu solicitud para saber si aún estás interesado/a o si podemos ayudarte con alguna información adicional.`;
  }

  return `Hola ${name}, te saludamos de Samora Estudio. Queríamos hacer seguimiento a tu solicitud y confirmar si necesitas ayuda con algún detalle adicional.`;
}

function openWhatsapp(followup: CustomerFollowup) {
  const phone = normalizePhone(followup.customer_phone);
  const message = buildWhatsappMessage(followup);

  const url = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank", "noopener,noreferrer");
}

function getPriorityStyle(priority: string) {
  if (priority === "urgente") {
    return "border-red-400/25 bg-red-400/[0.06] text-red-200";
  }

  if (priority === "alta") {
    return "border-yellow-400/25 bg-yellow-400/[0.06] text-yellow-200";
  }

  if (priority === "baja") {
    return "border-white/10 bg-white/[0.03] text-white/35";
  }

  return "border-white/10 bg-white/[0.04] text-white/50";
}

function getStatusStyle(status: string) {
  if (status === "cerrado") {
    return "border-green-400/25 bg-green-400/[0.06] text-green-200";
  }

  if (status === "cancelado") {
    return "border-red-400/25 bg-red-400/[0.06] text-red-200";
  }

  if (
    [
      "esperando_pago",
      "esperando_comprobante",
      "revisar_manual",
      "sin_respuesta",
    ].includes(status)
  ) {
    return "border-yellow-400/25 bg-yellow-400/[0.06] text-yellow-200";
  }

  return "border-white/10 bg-white/[0.04] text-white/50";
}

function isClosedFollowup(status: string) {
  return ["cerrado", "cancelado"].includes(status);
}

function getBogotaDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}

function getFollowupTiming(followup: CustomerFollowup) {
  if (!followup.next_followup_at) {
    return {
      label: "Sin programar",
      className: "text-white/30",
    };
  }

  const today = getBogotaDateKey(new Date());
  const target = getBogotaDateKey(followup.next_followup_at);

  if (!isClosedFollowup(followup.status) && target < today) {
    return {
      label: `Vencido · ${formatShortDate(followup.next_followup_at)}`,
      className: "text-red-300",
    };
  }

  if (!isClosedFollowup(followup.status) && target === today) {
    return {
      label: `Hoy · ${formatShortDate(followup.next_followup_at)}`,
      className: "text-yellow-200",
    };
  }

  return {
    label: formatShortDate(followup.next_followup_at),
    className: "text-white/40",
  };
}

export default function CustomerFollowupsAdmin({
  initialFollowups,
}: {
  initialFollowups: CustomerFollowup[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const searchParams = useSearchParams();
  const focusFollowupId = searchParams.get("focus");
  const handledFocusRef = useRef("");

  const [followups, setFollowups] =
    useState<CustomerFollowup[]>(initialFollowups);

  const [selectedId, setSelectedId] = useState(initialFollowups[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [originFilter, setOriginFilter] = useState("todos");
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notice, setNotice] = useState("");

  const [newFollowup, setNewFollowup] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    title: "",
    summary: "",
    status: "pendiente_contactar",
    priority: "normal",
    next_followup_at: "",
  });

  const filteredFollowups = useMemo(() => {
    const query = search.trim().toLowerCase();

    return followups.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.customer_name,
          item.customer_phone,
          item.customer_email,
          item.customer_document,
          item.related_code,
          item.title,
          item.summary,
          item.internal_notes,
          getFollowupDisplayTitle(item),
          getFollowupOriginLabel(item),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "todos" || item.status === statusFilter;

      const matchesPriority =
        priorityFilter === "todas" || item.priority === priorityFilter;

      const matchesOrigin =
        originFilter === "todos" || item.related_type === originFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesOrigin
      );
    });
  }, [followups, originFilter, priorityFilter, search, statusFilter]);

  const selectedFollowup =
    filteredFollowups.find((item) => item.id === selectedId) ??
    filteredFollowups[0] ??
    null;

  const pendingCount = followups.filter((item) =>
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

  const urgentCount = followups.filter((item) =>
    ["alta", "urgente"].includes(item.priority)
  ).length;

  const scheduledCount = followups.filter(
    (item) => Boolean(item.next_followup_at) && !isClosedFollowup(item.status)
  ).length;

  const todayKey = getBogotaDateKey(new Date());

  const dueCount = followups.filter((item) => {
    if (!item.next_followup_at || isClosedFollowup(item.status)) return false;

    return getBogotaDateKey(item.next_followup_at) <= todayKey;
  }).length;

  useEffect(() => {
    if (!focusFollowupId || handledFocusRef.current === focusFollowupId) return;

    const focusedFollowup = followups.find(
      (item) =>
        item.id === focusFollowupId ||
        item.related_id === focusFollowupId ||
        item.related_code === focusFollowupId
    );

    handledFocusRef.current = focusFollowupId;
    setStatusFilter("todos");
    setPriorityFilter("todas");
    setOriginFilter("todos");

    if (!focusedFollowup) {
      setSearch(focusFollowupId);
      showNotice(
        "No se encontró el seguimiento exacto. Se dejó el código en búsqueda para revisión manual."
      );
      return;
    }

    setSearch("");
    setSelectedId(focusedFollowup.id);
    showNotice("Seguimiento seleccionado desde cotizaciones o pedidos.");

    window.setTimeout(() => {
      document
        .getElementById(`followup-${focusedFollowup.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }, [focusFollowupId, followups]);

  function showNotice(message: string) {
    setNotice(message);

    window.setTimeout(() => {
      setNotice("");
    }, 4500);
  }

  async function reloadFollowups() {
    const { data, error } = await supabase
      .from("customer_followups")
      .select(FOLLOWUPS_SELECT)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error(error);
      showNotice("No se pudo recargar la lista de seguimientos.");
      return;
    }

    const freshFollowups = (data ?? []) as CustomerFollowup[];

    setFollowups(freshFollowups);

    if (!freshFollowups.some((item) => item.id === selectedId)) {
      setSelectedId(freshFollowups[0]?.id ?? "");
    }
  }

  async function syncFollowups() {
    setIsSyncing(true);

    try {
      const response = await fetch("/api/admin/sync-customer-followups", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        showNotice(
          result?.detail ||
            result?.error ||
            "No se pudo sincronizar el CRM."
        );
        return;
      }

      await reloadFollowups();

      const inserted = Number(result?.inserted ?? 0);
      const processed = Number(result?.processed ?? 0);

      if (inserted > 0) {
        showNotice(
          `Sincronización lista: ${inserted} seguimiento(s) nuevo(s) creados.`
        );
      } else if (processed > 0) {
        showNotice(
          "Sincronización lista. No se crearon nuevos seguimientos porque ya existían."
        );
      } else {
        showNotice("No hay cotizaciones o pedidos pendientes para sincronizar.");
      }
    } catch (error) {
      console.error(error);
      showNotice("Ocurrió un error sincronizando cotizaciones y pedidos.");
    } finally {
      setIsSyncing(false);
    }
  }

  async function createFollowup() {
    if (!newFollowup.customer_name.trim() && !newFollowup.customer_phone.trim()) {
      showNotice("Agrega al menos el nombre o el WhatsApp del cliente.");
      return;
    }

    setIsSaving(true);

    const payload = {
      customer_name: newFollowup.customer_name.trim() || null,
      customer_phone: newFollowup.customer_phone.trim() || null,
      customer_email: newFollowup.customer_email.trim() || null,
      title: newFollowup.title.trim() || "Seguimiento manual",
      summary: newFollowup.summary.trim() || null,
      status: newFollowup.status,
      priority: newFollowup.priority,
      source: "manual",
      related_type: "manual",
      next_followup_at: fromDateTimeLocalValue(newFollowup.next_followup_at),
    };

    const { data, error } = await supabase
      .from("customer_followups")
      .insert(payload)
      .select("*")
      .single();

    setIsSaving(false);

    if (error) {
      console.error(error);
      showNotice("No se pudo crear el seguimiento.");
      return;
    }

    const created = data as CustomerFollowup;

    setFollowups((current) => [created, ...current]);
    setSelectedId(created.id);

    setNewFollowup({
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      title: "",
      summary: "",
      status: "pendiente_contactar",
      priority: "normal",
      next_followup_at: "",
    });

    showNotice("Seguimiento creado correctamente.");
  }

  async function updateFollowup(
    followup: CustomerFollowup,
    updates: Partial<CustomerFollowup>
  ) {
    setIsSaving(true);

    const { data, error } = await supabase
      .from("customer_followups")
      .update(updates)
      .eq("id", followup.id)
      .select("*")
      .single();

    setIsSaving(false);

    if (error) {
      console.error(error);
      showNotice("No se pudo actualizar el seguimiento.");
      return;
    }

    setFollowups((current) =>
      current.map((item) =>
        item.id === followup.id ? (data as CustomerFollowup) : item
      )
    );

    showNotice("Cambios guardados.");
  }

  async function registerWhatsappOpened(followup: CustomerFollowup) {
    const message = buildWhatsappMessage(followup);

    openWhatsapp(followup);

    const updates = {
      last_contacted_at: new Date().toISOString(),
      contact_attempts: followup.contact_attempts + 1,
      last_channel: "whatsapp",
      last_message_type: "seguimiento",
      last_message_body: message,
      status:
        followup.status === "pendiente_contactar"
          ? "contactado"
          : followup.status,
    };

    const { data, error } = await supabase
      .from("customer_followups")
      .update(updates)
      .eq("id", followup.id)
      .select("*")
      .single();

    if (!error && data) {
      setFollowups((current) =>
        current.map((item) =>
          item.id === followup.id ? (data as CustomerFollowup) : item
        )
      );
    }

    await supabase.from("customer_followup_logs").insert({
      followup_id: followup.id,
      action_type: "whatsapp_opened",
      channel: "whatsapp",
      message_template: "seguimiento_general",
      message_body: message,
      old_status: followup.status,
      new_status: updates.status,
      note: "Se abrió WhatsApp con mensaje preparado.",
    });

    if (window.samoraTrackEvent) {
      window.samoraTrackEvent("whatsapp_click", {
        trigger: "customer_followup_admin",
        followup_id: followup.id,
        customer_name: followup.customer_name,
      });
    }
  }

  return (
    <div>
      {notice && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white/70">
          {notice}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard label="Seguimientos" value={followups.length} />
        <MetricCard label="Pendientes" value={pendingCount} tone="yellow" />
        <MetricCard label="Hoy / vencidos" value={dueCount} tone="red" />
        <MetricCard label="Prioridad alta" value={urgentCount} tone="orange" />
        <MetricCard label="Programados" value={scheduledCount} tone="blue" />
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-neutral-950 p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/35">
              Sincronización
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
                Cotizaciones y pedidos pendientes
              </h2>

              <span className="rounded-full border border-white/10 bg-black px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/35">
                CRM automático
              </span>
            </div>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Incorpora procesos que todavía requieren contacto, pago, entrega
              o revisión sin duplicar seguimientos existentes.
            </p>
          </div>

          <button
            type="button"
            onClick={syncFollowups}
            disabled={isSyncing}
            className="inline-flex min-h-11 items-center justify-center whitespace-nowrap rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/75 transition hover:border-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-neutral-950 p-4 sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[1.2fr_210px_190px_190px]">
          <Input
            label="Buscar"
            value={search}
            onChange={setSearch}
            placeholder="Cliente, teléfono, código o nota..."
          />

          <Select
            label="Estado"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: "todos", label: "Todos los estados" }, ...statusOptions]}
          />

          <Select
            label="Prioridad"
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[{ value: "todas", label: "Todas" }, ...priorityOptions]}
          />

          <Select
            label="Origen"
            value={originFilter}
            onChange={setOriginFilter}
            options={originOptions}
          />
        </div>
      </section>

      <section className="mt-6 grid items-start gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <Panel
          title="Clientes en seguimiento"
          description={`${filteredFollowups.length} de ${followups.length} seguimientos visibles.`}
          compact
        >
          <div className="max-h-[720px] space-y-2 overflow-y-auto pr-1">
            {filteredFollowups.length > 0 ? (
              filteredFollowups.map((followup) => {
                const timing = getFollowupTiming(followup);

                return (
                  <button
                    key={followup.id}
                    id={`followup-${followup.id}`}
                    type="button"
                    onClick={() => setSelectedId(followup.id)}
                    className={`block w-full rounded-2xl border px-4 py-3.5 text-left transition hover:border-white/25 ${
                      selectedFollowup?.id === followup.id
                        ? "border-white/30 bg-white/[0.06]"
                        : "border-white/10 bg-black/45"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {followup.customer_name || "Cliente sin nombre"}
                        </p>

                        <p className="mt-1 truncate text-xs text-white/40">
                          {getFollowupDisplayTitle(followup)}
                          {followup.related_code
                            ? ` · ${followup.related_code}`
                            : ""}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.16em] ${getPriorityStyle(
                          followup.priority
                        )}`}
                      >
                        {priorityLabels[followup.priority] ?? followup.priority}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] ${getStatusStyle(
                          followup.status
                        )}`}
                      >
                        {statusLabels[followup.status] ?? followup.status}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.62rem] uppercase tracking-[0.14em] text-white/40">
                        {relatedLabels[followup.related_type] ??
                          followup.related_type}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                      <span className={timing.className}>
                        Próximo: {timing.label}
                      </span>

                      <span className="shrink-0 text-white/25">
                        {followup.contact_attempts}{" "}
                        {followup.contact_attempts === 1 ? "intento" : "intentos"}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <EmptyState text="No hay seguimientos con estos filtros." />
            )}
          </div>
        </Panel>

        <div className="xl:sticky xl:top-28">
          <Panel
            title="Detalle del seguimiento"
            description="Gestiona el caso sin perder el origen comercial del cliente."
          >
            {selectedFollowup ? (
              <FollowupDetail
                followup={selectedFollowup}
                isSaving={isSaving}
                onUpdate={updateFollowup}
                onWhatsapp={registerWhatsappOpened}
              />
            ) : (
              <EmptyState text="Selecciona un seguimiento para ver el detalle." />
            )}
          </Panel>
        </div>
      </section>

      <details className="group mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-neutral-950">
        <summary className="cursor-pointer list-none p-5 transition hover:bg-white/[0.025] [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/30">
                Acción secundaria
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">
                Crear seguimiento manual
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                Úsalo para clientes o casos que no provienen de una cotización
                o un pedido sincronizado.
              </p>
            </div>

            <span className="shrink-0 text-white/35 transition group-open:rotate-180">
              ↓
            </span>
          </div>
        </summary>

        <div className="border-t border-white/10 p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Nombre cliente"
              value={newFollowup.customer_name}
              onChange={(value) =>
                setNewFollowup((current) => ({
                  ...current,
                  customer_name: value,
                }))
              }
              placeholder="Nombre del cliente"
            />

            <Input
              label="WhatsApp"
              value={newFollowup.customer_phone}
              onChange={(value) =>
                setNewFollowup((current) => ({
                  ...current,
                  customer_phone: value,
                }))
              }
              placeholder="3138429568"
            />

            <Input
              label="Correo"
              value={newFollowup.customer_email}
              onChange={(value) =>
                setNewFollowup((current) => ({
                  ...current,
                  customer_email: value,
                }))
              }
              placeholder="cliente@email.com"
            />

            <Input
              label="Título"
              value={newFollowup.title}
              onChange={(value) =>
                setNewFollowup((current) => ({
                  ...current,
                  title: value,
                }))
              }
              placeholder="Ej: Pendiente abono de reserva"
            />

            <div className="lg:col-span-2">
              <Textarea
                label="Resumen"
                value={newFollowup.summary}
                onChange={(value) =>
                  setNewFollowup((current) => ({
                    ...current,
                    summary: value,
                  }))
                }
                placeholder="Describe brevemente el caso."
              />
            </div>

            <Select
              label="Estado"
              value={newFollowup.status}
              onChange={(value) =>
                setNewFollowup((current) => ({
                  ...current,
                  status: value,
                }))
              }
              options={statusOptions}
            />

            <Select
              label="Prioridad"
              value={newFollowup.priority}
              onChange={(value) =>
                setNewFollowup((current) => ({
                  ...current,
                  priority: value,
                }))
              }
              options={priorityOptions}
            />

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-white/35">
                Próximo seguimiento
              </span>

              <input
                type="datetime-local"
                value={newFollowup.next_followup_at}
                onChange={(event) =>
                  setNewFollowup((current) => ({
                    ...current,
                    next_followup_at: event.target.value,
                  }))
                }
                className="admin-input h-12 w-full rounded-2xl border border-white/10 bg-black px-4 text-sm text-white outline-none transition focus:border-white/30"
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={createFollowup}
                disabled={isSaving}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 lg:w-auto"
              >
                {isSaving ? "Guardando..." : "Crear seguimiento"}
              </button>
            </div>
          </div>
        </div>
      </details>

      <style jsx global>{`
        .admin-input {
          color-scheme: dark;
        }

        .admin-input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: invert(1) brightness(1.8);
          opacity: 0.72;
        }

        .admin-input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

function FollowupDetail({
  followup,
  isSaving,
  onUpdate,
  onWhatsapp,
}: {
  followup: CustomerFollowup;
  isSaving: boolean;
  onUpdate: (
    followup: CustomerFollowup,
    updates: Partial<CustomerFollowup>
  ) => Promise<void>;
  onWhatsapp: (followup: CustomerFollowup) => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    customer_name: followup.customer_name ?? "",
    customer_phone: followup.customer_phone ?? "",
    customer_email: followup.customer_email ?? "",
    title: followup.title ?? "",
    summary: followup.summary ?? "",
    internal_notes: followup.internal_notes ?? "",
    status: followup.status,
    priority: followup.priority,
    next_followup_at: toDateTimeLocalValue(followup.next_followup_at),
  });

  useEffect(() => {
    setDraft({
      customer_name: followup.customer_name ?? "",
      customer_phone: followup.customer_phone ?? "",
      customer_email: followup.customer_email ?? "",
      title: followup.title ?? "",
      summary: followup.summary ?? "",
      internal_notes: followup.internal_notes ?? "",
      status: followup.status,
      priority: followup.priority,
      next_followup_at: toDateTimeLocalValue(followup.next_followup_at),
    });
  }, [followup]);

  async function saveChanges() {
    await onUpdate(followup, {
      customer_name: draft.customer_name.trim() || null,
      customer_phone: draft.customer_phone.trim() || null,
      customer_email: draft.customer_email.trim() || null,
      title: draft.title.trim() || null,
      summary: draft.summary.trim() || null,
      internal_notes: draft.internal_notes.trim() || null,
      status: draft.status,
      priority: draft.priority,
      next_followup_at: fromDateTimeLocalValue(draft.next_followup_at),
    });
  }

  const timing = getFollowupTiming(followup);

  return (
    <div className="grid gap-4">
      <section className="rounded-2xl border border-white/10 bg-black/55 p-4 sm:p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-white/30">
              Ficha activa
            </p>

            <h3 className="mt-2 break-words text-2xl font-semibold tracking-[-0.04em] text-white sm:text-3xl">
              {followup.customer_name || "Cliente sin nombre"}
            </h3>

            <p className="mt-2 text-sm text-white/45">
              {getFollowupDisplayTitle(followup)}
              {followup.related_code ? ` · ${followup.related_code}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:max-w-[48%] lg:justify-end">
            <span
              className={`rounded-full border px-3 py-1 text-[0.62rem] uppercase tracking-[0.16em] ${getStatusStyle(
                followup.status
              )}`}
            >
              {statusLabels[followup.status] ?? followup.status}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-[0.62rem] uppercase tracking-[0.16em] ${getPriorityStyle(
                followup.priority
              )}`}
            >
              {priorityLabels[followup.priority] ?? followup.priority}
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[0.62rem] uppercase tracking-[0.16em] text-white/40">
              {relatedLabels[followup.related_type] ?? followup.related_type}
            </span>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MiniInfo
            label="Próximo contacto"
            value={timing.label}
            valueClassName={timing.className}
          />
          <MiniInfo
            label="Último contacto"
            value={formatDate(followup.last_contacted_at)}
          />
          <MiniInfo
            label="Intentos"
            value={String(followup.contact_attempts)}
          />
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onWhatsapp(followup)}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:scale-[1.01]"
          >
            Abrir WhatsApp
          </button>

          <OriginAction followup={followup} compact />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/45 p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
            Contacto
          </p>

          <div className="mt-4 grid gap-3 text-sm">
            <InfoLine
              label="WhatsApp"
              value={followup.customer_phone || "Sin número"}
            />
            <InfoLine
              label="Correo"
              value={followup.customer_email || "Sin correo"}
            />
            <InfoLine
              label="Origen"
              value={getFollowupOriginLabel(followup)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/45 p-4">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
            Última interacción
          </p>

          <div className="mt-4 grid gap-3 text-sm">
            <InfoLine
              label="Canal"
              value={followup.last_channel || "Sin registro"}
            />
            <InfoLine
              label="Tipo"
              value={followup.last_message_type || "Sin registro"}
            />
            <InfoLine
              label="Actualizado"
              value={formatDate(followup.updated_at)}
            />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/45 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
              Resumen del caso
            </p>

            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/65">
              {followup.summary || "No hay un resumen registrado para este seguimiento."}
            </p>
          </div>

          <div className="border-t border-white/10 pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
              Notas internas
            </p>

            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/55">
              {followup.internal_notes || "Sin notas internas."}
            </p>
          </div>
        </div>

        {followup.last_message_body && (
          <details className="group mt-4 border-t border-white/10 pt-4">
            <summary className="cursor-pointer list-none text-sm text-white/45 transition hover:text-white [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                Ver último mensaje preparado
                <span className="text-white/25 transition group-open:rotate-180">
                  ↓
                </span>
              </span>
            </summary>

            <p className="mt-3 whitespace-pre-wrap rounded-xl border border-white/10 bg-black p-3 text-xs leading-5 text-white/45">
              {followup.last_message_body}
            </p>
          </details>
        )}
      </section>

      <details className="group overflow-hidden rounded-2xl border border-white/10 bg-black/45">
        <summary className="cursor-pointer list-none p-4 transition hover:bg-white/[0.025] [&::-webkit-details-marker]:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                Edición
              </p>

              <p className="mt-1 font-medium text-white">
                Editar seguimiento
              </p>

              <p className="mt-1 text-xs leading-5 text-white/35">
                Datos del cliente, estado, prioridad, notas y próximo contacto.
              </p>
            </div>

            <span className="shrink-0 text-white/30 transition group-open:rotate-180">
              ↓
            </span>
          </div>
        </summary>

        <div className="border-t border-white/10 p-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Input
              label="Nombre"
              value={draft.customer_name}
              onChange={(value) =>
                setDraft((current) => ({ ...current, customer_name: value }))
              }
            />

            <Input
              label="WhatsApp"
              value={draft.customer_phone}
              onChange={(value) =>
                setDraft((current) => ({ ...current, customer_phone: value }))
              }
            />

            <Input
              label="Correo"
              value={draft.customer_email}
              onChange={(value) =>
                setDraft((current) => ({ ...current, customer_email: value }))
              }
            />

            <Input
              label="Título"
              value={draft.title}
              onChange={(value) =>
                setDraft((current) => ({ ...current, title: value }))
              }
            />

            <div className="lg:col-span-2">
              <Textarea
                label="Resumen"
                value={draft.summary}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, summary: value }))
                }
              />
            </div>

            <div className="lg:col-span-2">
              <Textarea
                label="Notas internas"
                value={draft.internal_notes}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, internal_notes: value }))
                }
              />
            </div>

            <Select
              label="Estado"
              value={draft.status}
              onChange={(value) =>
                setDraft((current) => ({ ...current, status: value }))
              }
              options={statusOptions}
            />

            <Select
              label="Prioridad"
              value={draft.priority}
              onChange={(value) =>
                setDraft((current) => ({ ...current, priority: value }))
              }
              options={priorityOptions}
            />

            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-white/35">
                Próximo seguimiento
              </span>

              <input
                type="datetime-local"
                value={draft.next_followup_at}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    next_followup_at: event.target.value,
                  }))
                }
                className="admin-input h-12 w-full rounded-2xl border border-white/10 bg-black px-4 text-sm text-white outline-none transition focus:border-white/30"
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={saveChanges}
                disabled={isSaving}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}

function MiniInfo({
  label,
  value,
  valueClassName = "text-white/70",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">
        {label}
      </p>
      <p className={`mt-2 break-words text-sm font-medium ${valueClassName}`}>
        {value}
      </p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/30">{label}</p>
      <p className="mt-1 break-words text-white/65">{value}</p>
    </div>
  );
}

function OriginAction({
  followup,
  compact = false,
}: {
  followup: CustomerFollowup;
  compact?: boolean;
}) {
  let href = "";
  let label = "";

  if (followup.related_type === "quote_request") {
    href = followup.related_id
      ? `/admin/cotizaciones?focus=${encodeURIComponent(followup.related_id)}`
      : "/admin/cotizaciones";
    label = "Ver cotización →";
  } else if (followup.related_type === "store_order") {
    href = followup.related_id
      ? `/admin/pedidos?focus=${encodeURIComponent(
          followup.related_id
        )}#order-${followup.related_id}`
      : "/admin/pedidos";
    label = "Ver pedido →";
  } else {
    return compact ? (
      <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/25">
        Seguimiento manual
      </span>
    ) : null;
  }

  if (compact) {
    return (
      <Link
        href={href}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/70 transition hover:border-white hover:bg-white hover:text-black"
      >
        {label}
      </Link>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap gap-3 border-t border-white/10 pt-4">
      <Link
        href={href}
        className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white hover:bg-white hover:text-black"
      >
        {label}
      </Link>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "white",
}: {
  label: string;
  value: number;
  tone?: "white" | "yellow" | "red" | "orange" | "blue";
}) {
  const toneClass =
    tone === "yellow"
      ? "text-yellow-300"
      : tone === "red"
      ? "text-red-300"
      : tone === "orange"
      ? "text-orange-300"
      : tone === "blue"
      ? "text-cyan-300"
      : "text-white";

  return (
    <article className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4 sm:rounded-[1.5rem] sm:p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>

      <p className={`mt-3 text-2xl font-bold sm:text-3xl ${toneClass}`}>
        {value}
      </p>
    </article>
  );
}

function Panel({
  title,
  description,
  children,
  compact = false,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5">
      <div
        className={`border-b border-white/10 ${
          compact ? "mb-4 pb-4" : "mb-5 pb-5"
        }`}
      >
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-white/45">{description}</p>
      </div>

      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-white/35">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-white/10 bg-black px-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-white/35">
        {label}
      </span>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/20 focus:border-white/30"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.24em] text-white/35">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-white/10 bg-black px-4 text-sm text-white outline-none transition focus:border-white/30"
      >
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/15 bg-black/35 p-5 text-sm leading-6 text-white/40">
      {text}
    </div>
  );
}