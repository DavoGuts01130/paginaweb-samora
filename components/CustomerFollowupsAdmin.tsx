"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

export default function CustomerFollowupsAdmin({
  initialFollowups,
}: {
  initialFollowups: CustomerFollowup[];
}) {
  const supabase = useMemo(() => createClient(), []);

  const [followups, setFollowups] =
    useState<CustomerFollowup[]>(initialFollowups);

  const [selectedId, setSelectedId] = useState(initialFollowups[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");
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
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "todos" || item.status === statusFilter;

      const matchesPriority =
        priorityFilter === "todas" || item.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [followups, priorityFilter, search, statusFilter]);

  const selectedFollowup =
    followups.find((item) => item.id === selectedId) ??
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

  const scheduledCount = followups.filter((item) =>
    Boolean(item.next_followup_at)
  ).length;

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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Seguimientos" value={followups.length} />
        <MetricCard label="Pendientes" value={pendingCount} />
        <MetricCard label="Prioridad alta" value={urgentCount} />
        <MetricCard label="Programados" value={scheduledCount} />
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/35">
              Sincronización
            </p>

            <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">
              Cotizaciones y pedidos pendientes
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
              Crea seguimientos automáticamente desde cotizaciones y pedidos que
              aún requieren contacto, pago, entrega o revisión.
            </p>
          </div>

          <button
            type="button"
            onClick={syncFollowups}
            disabled={isSyncing}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/75 transition hover:border-white hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSyncing ? "Sincronizando..." : "Sincronizar cotizaciones y pedidos"}
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <Input
            label="Buscar"
            value={search}
            onChange={setSearch}
            placeholder="Nombre, teléfono, correo, código o nota"
          />

          <Select
            label="Estado"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: "todos", label: "Todos" }, ...statusOptions]}
          />

          <Select
            label="Prioridad"
            value={priorityFilter}
            onChange={setPriorityFilter}
            options={[{ value: "todas", label: "Todas" }, ...priorityOptions]}
          />
        </div>
      </section>

      <section className="mt-6 grid items-start gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel
          title="Clientes en seguimiento"
          description="Revisa casos comerciales pendientes, cotizaciones y pedidos sincronizados."
        >
          <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {filteredFollowups.length > 0 ? (
              filteredFollowups.map((followup) => (
                <button
                  key={followup.id}
                  type="button"
                  onClick={() => setSelectedId(followup.id)}
                  className={`block w-full rounded-2xl border p-4 text-left transition hover:border-white/25 ${
                    selectedFollowup?.id === followup.id
                      ? "border-white/30 bg-white/[0.06]"
                      : "border-white/10 bg-black/45"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        {followup.customer_name || "Cliente sin nombre"}
                      </p>

                      <p className="mt-1 truncate text-sm text-white/40">
                        {getFollowupDisplayTitle(followup)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.18em] ${getPriorityStyle(
                        followup.priority
                      )}`}
                    >
                      {priorityLabels[followup.priority] ?? followup.priority}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.16em] ${getStatusStyle(
                        followup.status
                      )}`}
                    >
                      {statusLabels[followup.status] ?? followup.status}
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-white/35">
                      {sourceLabels[followup.source] ?? followup.source}
                    </span>

                    {followup.related_code && (
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-white/35">
                        {followup.related_code}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-white/35">
                    Próximo: {formatShortDate(followup.next_followup_at)}
                  </p>
                </button>
              ))
            ) : (
              <EmptyState text="No hay seguimientos con estos filtros." />
            )}
          </div>
        </Panel>

        <Panel
          title="Detalle del seguimiento"
          description="Actualiza el estado, programa próximos contactos y abre WhatsApp con mensaje listo."
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
      </section>

      <section className="mt-6">
        <Panel
          title="Crear seguimiento manual"
          description="Agrega un cliente o caso que no venga desde cotizaciones o pedidos."
        >
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
        </Panel>
      </section>
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

  return (
    <div className="grid gap-5">
      <div className="rounded-2xl border border-white/10 bg-black/45 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              Cliente
            </p>

            <h3 className="mt-2 break-words text-2xl font-semibold tracking-[-0.04em] text-white">
              {followup.customer_name || "Cliente sin nombre"}
            </h3>

            <div className="mt-3 grid gap-1 text-sm text-white/45">
              <p className="break-words">
                WhatsApp: {followup.customer_phone || "Sin número"}
              </p>
              <p className="break-words">
                Correo: {followup.customer_email || "Sin correo"}
              </p>
              <p>Intentos: {followup.contact_attempts}</p>
              <p>Último contacto: {formatDate(followup.last_contacted_at)}</p>
              <p>{getFollowupOriginLabel(followup)}</p>
              {followup.related_code && <p>Código: {followup.related_code}</p>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <span
              className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] ${getStatusStyle(
                followup.status
              )}`}
            >
              {statusLabels[followup.status] ?? followup.status}
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] ${getPriorityStyle(
                followup.priority
              )}`}
            >
              {priorityLabels[followup.priority] ?? followup.priority}
            </span>

            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-white/35">
              {relatedLabels[followup.related_type] ?? followup.related_type}
            </span>
          </div>
        </div>

        <OriginAction followup={followup} />
      </div>

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

        <div className="grid gap-3 sm:grid-cols-2 lg:self-end">
          <button
            type="button"
            onClick={saveChanges}
            disabled={isSaving}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </button>

          <button
            type="button"
            onClick={() => onWhatsapp(followup)}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/75 transition hover:border-white hover:bg-white hover:text-black"
          >
            Abrir WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function OriginAction({ followup }: { followup: CustomerFollowup }) {
  if (followup.related_type === "quote_request") {
    const href = followup.related_id
      ? `/admin/cotizaciones?focus=${encodeURIComponent(followup.related_id)}`
      : "/admin/cotizaciones";

    return (
      <div className="mt-4 flex flex-wrap gap-3 border-t border-white/10 pt-4">
        <Link
          href={href}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white hover:bg-white hover:text-black"
        >
          Ver cotización →
        </Link>
      </div>
    );
  }

  if (followup.related_type === "store_order") {
    const href = followup.related_id
      ? `/admin/pedidos?focus=${encodeURIComponent(
          followup.related_id
        )}#order-${followup.related_id}`
      : "/admin/pedidos";

    return (
      <div className="mt-4 flex flex-wrap gap-3 border-t border-white/10 pt-4">
        <Link
          href={href}
          className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white/70 transition hover:border-white hover:bg-white hover:text-black"
        >
          Ver pedido →
        </Link>
      </div>
    );
  }

  return null;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-white/35">
        {label}
      </p>

      <p className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-white">
        {value}
      </p>
    </article>
  );
}

function Panel({
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