"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export type QuoteStatus =
  | "new"
  | "new_travel_review"
  | "reviewing"
  | "approved"
  | "scheduled"
  | "rejected";

export type QuoteRequest = {
  id: string;
  quote_code: string;
  customer_name: string | null;
  customer_phone: string | null;
  service_type: string;
  service_label: string;
  event_date: string | null;
  service_zone: string;
  service_zone_label: string;
  service_location: string | null;
  duration_value: number | null;
  duration_unit: string | null;
  duration_hours: number | null;
  quantity: number | null;
  digital_delivery: boolean | null;
  printed_delivery: boolean | null;
  special_deliverable: boolean | null;
  details: string | null;
  base_min_cop: number;
  base_max_cop: number;
  travel_surcharge_percent: number;
  travel_surcharge_min_cop: number;
  travel_surcharge_max_cop: number;
  estimated_min_cop: number;
  estimated_max_cop: number;
  requires_travel_review: boolean | null;
  requires_manual_review: boolean | null;
  whatsapp_message: string | null;
  status: QuoteStatus | string;
  admin_notes: string | null;
  approved_at: string | null;
  scheduled_at: string | null;
  google_calendar_event_id: string | null;
  confirmed_event_date: string | null;
  confirmed_start_time: string | null;
  confirmed_end_time: string | null;
  confirmed_timezone: string | null;
  confirmed_location: string | null;
  schedule_notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string | null;
};

type ServiceKey =
  | "sesion_individual"
  | "pareja_embarazo"
  | "mascotas"
  | "evento_social"
  | "grados"
  | "producto_marca"
  | "impresiones"
  | "web_software";

type ServiceZoneKey =
  | "guatavita"
  | "municipio_cercano"
  | "bogota_sabana"
  | "cundinamarca_lejano"
  | "fuera_cundinamarca";

type QuoteRule = {
  label: string;
  min: number;
  max: number;
  perHourMin?: number;
  perHourMax?: number;
  perUnitMin?: number;
  perUnitMax?: number;
  unitLabel?: string;
};

type ServiceZoneRule = {
  label: string;
  description: string;
  surchargePercent: number;
  requiresTravelReview: boolean;
};

type EditValues = {
  customer_name: string;
  customer_phone: string;
  service_type: ServiceKey;
  event_date: string;
  service_zone: ServiceZoneKey;
  service_location: string;
  duration_hours_value: string;
  duration_minutes_value: string;
  quantity: string;
  digital_delivery: boolean;
  printed_delivery: boolean;
  special_deliverable: boolean;
  estimated_min_cop: string;
  estimated_max_cop: string;
  details: string;
  admin_notes: string;
};

type ScheduleValues = {
  confirmed_event_date: string;
  confirmed_start_time: string;
  confirmed_end_time: string;
  confirmed_timezone: string;
  confirmed_location: string;
  schedule_notes: string;
};

const quoteRules: Record<ServiceKey, QuoteRule> = {
  sesion_individual: {
    label: "Sesión individual / retrato",
    min: 180000,
    max: 350000,
    perHourMin: 40000,
    perHourMax: 70000,
  },
  pareja_embarazo: {
    label: "Pareja / embarazo",
    min: 220000,
    max: 480000,
    perHourMin: 50000,
    perHourMax: 90000,
  },
  mascotas: {
    label: "Mascotas",
    min: 160000,
    max: 320000,
    perHourMin: 40000,
    perHourMax: 70000,
  },
  evento_social: {
    label: "Evento social / empresarial",
    min: 650000,
    max: 1800000,
    perHourMin: 90000,
    perHourMax: 160000,
  },
  grados: {
    label: "Grados / colegio",
    min: 700000,
    max: 1600000,
    perUnitMin: 22000,
    perUnitMax: 45000,
    unitLabel: "estudiante",
  },
  producto_marca: {
    label: "Fotografía de producto / gastronomía",
    min: 250000,
    max: 750000,
    perUnitMin: 25000,
    perUnitMax: 60000,
    unitLabel: "producto/foto",
  },
  impresiones: {
    label: "Impresiones / marcos / recuerdos",
    min: 30000,
    max: 180000,
    perUnitMin: 15000,
    perUnitMax: 80000,
    unitLabel: "unidad",
  },
  web_software: {
    label: "Desarrollo web / software",
    min: 800000,
    max: 4500000,
  },
};

const serviceZones: Record<ServiceZoneKey, ServiceZoneRule> = {
  guatavita: {
    label: "Guatavita",
    description: "Servicio dentro de Guatavita.",
    surchargePercent: 0,
    requiresTravelReview: false,
  },
  municipio_cercano: {
    label: "Municipio cercano",
    description:
      "Sesquilé, Guasca, Sopó, Tocancipá, Gachancipá o alrededores.",
    surchargePercent: 10,
    requiresTravelReview: false,
  },
  bogota_sabana: {
    label: "Bogotá / Sabana",
    description: "Bogotá, Chía, Cajicá, Zipaquirá u otras zonas de la sabana.",
    surchargePercent: 20,
    requiresTravelReview: false,
  },
  cundinamarca_lejano: {
    label: "Cundinamarca lejano",
    description: "Municipios más alejados dentro de Cundinamarca.",
    surchargePercent: 30,
    requiresTravelReview: false,
  },
  fuera_cundinamarca: {
    label: "Fuera de Cundinamarca / otra ciudad",
    description:
      "Requiere revisión de transporte, hospedaje, alimentación, tiempos de traslado y disponibilidad.",
    surchargePercent: 0,
    requiresTravelReview: true,
  },
};

const statusOptions: {
  value: QuoteStatus;
  label: string;
}[] = [
  { value: "new", label: "Nueva" },
  { value: "new_travel_review", label: "Revisión desplazamiento" },
  { value: "reviewing", label: "En revisión" },
  { value: "approved", label: "Aprobada" },
  { value: "scheduled", label: "Agendada" },
  { value: "rejected", label: "Rechazada" },
];

const statusLabels: Record<string, string> = {
  new: "Nueva",
  new_travel_review: "Revisión desplazamiento",
  reviewing: "En revisión",
  approved: "Aprobada",
  scheduled: "Agendada",
  rejected: "Rechazada",
};

const serviceOptions = Object.entries(quoteRules).map(([value, rule]) => ({
  value: value as ServiceKey,
  label: rule.label,
}));

const zoneOptions = Object.entries(serviceZones).map(([value, zone]) => ({
  value: value as ServiceZoneKey,
  label: zone.label,
}));

function formatCOP(value: number | null | undefined) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "Por definir";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Por definir";
  return value.slice(0, 5);
}

function parseCOPInput(value: string) {
  return Math.max(Number(value.replace(/\D/g, "")) || 0, 0);
}

function toServiceKey(value: string | null | undefined): ServiceKey {
  if (value && value in quoteRules) return value as ServiceKey;
  return "sesion_individual";
}

function toZoneKey(value: string | null | undefined): ServiceZoneKey {
  if (value && value in serviceZones) return value as ServiceZoneKey;
  return "guatavita";
}

function getDurationFromQuote(quote: QuoteRequest) {
  const totalMinutes = Number(quote.duration_value ?? 0);

  if (quote.duration_unit === "minutos_totales" && totalMinutes > 0) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return {
      hoursValue: String(hours),
      minutesValue: String(minutes),
    };
  }

  if (quote.duration_hours && quote.duration_hours > 0) {
    const hours = Math.floor(Number(quote.duration_hours));
    const minutes = Math.round((Number(quote.duration_hours) - hours) * 60);

    return {
      hoursValue: String(hours),
      minutesValue: String(minutes),
    };
  }

  return {
    hoursValue: "0",
    minutesValue: "0",
  };
}

function createEditValues(quote: QuoteRequest): EditValues {
  const duration = getDurationFromQuote(quote);

  return {
    customer_name: quote.customer_name ?? "",
    customer_phone: quote.customer_phone ?? "",
    service_type: toServiceKey(quote.service_type),
    event_date: quote.event_date ?? "",
    service_zone: toZoneKey(quote.service_zone),
    service_location: quote.service_location ?? "",
    duration_hours_value: duration.hoursValue,
    duration_minutes_value: duration.minutesValue,
    quantity: quote.quantity ? String(quote.quantity) : "1",
    digital_delivery: !!quote.digital_delivery,
    printed_delivery: !!quote.printed_delivery,
    special_deliverable: !!quote.special_deliverable,
    estimated_min_cop: String(quote.estimated_min_cop ?? 0),
    estimated_max_cop: String(quote.estimated_max_cop ?? 0),
    details: quote.details ?? "",
    admin_notes: quote.admin_notes ?? "",
  };
}

function createScheduleValues(quote: QuoteRequest): ScheduleValues {
  return {
    confirmed_event_date: quote.confirmed_event_date ?? "",
    confirmed_start_time: quote.confirmed_start_time?.slice(0, 5) ?? "",
    confirmed_end_time: quote.confirmed_end_time?.slice(0, 5) ?? "",
    confirmed_timezone: quote.confirmed_timezone ?? "America/Bogota",
    confirmed_location:
      quote.confirmed_location ?? quote.service_location ?? "",
    schedule_notes: quote.schedule_notes ?? "",
  };
}

function getDurationHours(hoursValue: string, minutesValue: string) {
  const hours = Math.max(Number(hoursValue) || 0, 0);
  const minutes = Math.max(Number(minutesValue) || 0, 0);

  return hours + minutes / 60;
}

function getDurationTotalMinutes(hoursValue: string, minutesValue: string) {
  const hours = Math.max(Number(hoursValue) || 0, 0);
  const minutes = Math.max(Number(minutesValue) || 0, 0);

  return hours * 60 + minutes;
}

function getDurationLabelFromValues(values: EditValues) {
  const hours = Math.max(Number(values.duration_hours_value) || 0, 0);
  const minutes = Math.max(Number(values.duration_minutes_value) || 0, 0);

  if (hours === 0 && minutes === 0) return "Por definir";

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minuto" : "minutos"}`);
  }

  return parts.join(" y ");
}

function getDurationLabel(quote: QuoteRequest) {
  const values = createEditValues(quote);
  return getDurationLabelFromValues(values);
}

function getFinalPriceLabel(quote: QuoteRequest) {
  if (quote.estimated_min_cop === quote.estimated_max_cop) {
    return formatCOP(quote.estimated_min_cop);
  }

  return `${formatCOP(quote.estimated_min_cop)} - ${formatCOP(
    quote.estimated_max_cop
  )}`;
}

function getEstimateFromValues(values: EditValues) {
  const selectedRule = quoteRules[values.service_type];
  const selectedZone = serviceZones[values.service_zone];

  const durationHours = getDurationHours(
    values.duration_hours_value,
    values.duration_minutes_value
  );

  const parsedQuantity = Math.max(Number(values.quantity) || 0, 0);

  let baseMin = selectedRule.min;
  let baseMax = selectedRule.max;

  if (selectedRule.perHourMin && durationHours > 2) {
    const extraHours = durationHours - 2;

    baseMin += extraHours * selectedRule.perHourMin;
    baseMax +=
      extraHours * (selectedRule.perHourMax ?? selectedRule.perHourMin);
  }

  if (selectedRule.perUnitMin && parsedQuantity > 1) {
    const extraUnits = parsedQuantity - 1;

    baseMin += extraUnits * selectedRule.perUnitMin;
    baseMax += extraUnits * (selectedRule.perUnitMax ?? selectedRule.perUnitMin);
  }

  if (values.printed_delivery) {
    baseMin += 80000;
    baseMax += 280000;
  }

  if (values.special_deliverable) {
    baseMin += 120000;
    baseMax += 650000;
  }

  const surchargePercent = selectedZone.requiresTravelReview
    ? 0
    : selectedZone.surchargePercent;

  const surchargeMin = baseMin * (surchargePercent / 100);
  const surchargeMax = baseMax * (surchargePercent / 100);

  const autoTotalMin = Math.round(baseMin + surchargeMin);
  const autoTotalMax = Math.round(baseMax + surchargeMax);

  const manualMin = parseCOPInput(values.estimated_min_cop);
  const manualMax = parseCOPInput(values.estimated_max_cop);

  const hasManualPrice = manualMin > 0 || manualMax > 0;

  const finalMin = hasManualPrice ? manualMin || manualMax : autoTotalMin;
  const finalMax = hasManualPrice ? manualMax || manualMin : autoTotalMax;

  const normalizedMin = Math.min(finalMin, finalMax);
  const normalizedMax = Math.max(finalMin, finalMax);

  return {
    baseMin: Math.round(baseMin),
    baseMax: Math.round(baseMax),
    surchargePercent,
    surchargeMin: Math.round(surchargeMin),
    surchargeMax: Math.round(surchargeMax),
    autoTotalMin,
    autoTotalMax,
    totalMin: normalizedMin,
    totalMax: normalizedMax,
    manualAdjusted:
      normalizedMin !== autoTotalMin || normalizedMax !== autoTotalMax,
    label:
      normalizedMin === normalizedMax
        ? formatCOP(normalizedMin)
        : `${formatCOP(normalizedMin)} - ${formatCOP(normalizedMax)}`,
    autoLabel:
      autoTotalMin === autoTotalMax
        ? formatCOP(autoTotalMin)
        : `${formatCOP(autoTotalMin)} - ${formatCOP(autoTotalMax)}`,
    baseLabel: `${formatCOP(Math.round(baseMin))} - ${formatCOP(
      Math.round(baseMax)
    )}`,
    surchargeLabel:
      surchargePercent > 0
        ? `${formatCOP(Math.round(surchargeMin))} - ${formatCOP(
            Math.round(surchargeMax)
          )}`
        : formatCOP(0),
  };
}

function buildWhatsappMessageForValues(quoteCode: string, values: EditValues) {
  const selectedRule = quoteRules[values.service_type];
  const selectedZone = serviceZones[values.service_zone];
  const estimate = getEstimateFromValues(values);

  const quantityLabel = selectedRule.unitLabel
    ? `${values.quantity || "Por definir"} ${selectedRule.unitLabel}(s)`
    : `${values.quantity || "Por definir"}`;

  const travelLine = selectedZone.requiresTravelReview
    ? "Requiere revisión manual por desplazamiento."
    : `Recargo estimado: ${selectedZone.surchargePercent}% (${estimate.surchargeLabel})`;

  const travelNote = selectedZone.requiresTravelReview
    ? "Al ser un servicio fuera de Cundinamarca, el valor final puede variar según transporte, hospedaje, alimentación, tiempos de traslado y disponibilidad."
    : "El valor puede ajustarse según disponibilidad, ubicación exacta, complejidad del servicio y condiciones finales de entrega.";

  const lines = [
    "*SAMORA STUDIO*",
    estimate.manualAdjusted
      ? "*Cotización ajustada por Samora Studio*"
      : "*Solicitud de cotización*",
    "",
    "--------------------------------",
    `*Código:* ${quoteCode}`,
    `*Cliente:* ${values.customer_name || "Por completar"}`,
    `*WhatsApp:* ${values.customer_phone || "Por completar"}`,
    "",
    "*Servicio solicitado*",
    `- Tipo: ${selectedRule.label}`,
    `- Fecha aproximada: ${values.event_date || "Por definir"}`,
    `- Zona: ${selectedZone.label}`,
    `- Lugar exacto: ${values.service_location || "Por definir"}`,
    `- Duración estimada: ${getDurationLabelFromValues(values)}`,
    `- Cantidad aproximada: ${quantityLabel}`,
    "",
    "*Entregables*",
    `- Entrega digital: ${values.digital_delivery ? "Sí" : "No"}`,
    `- Entrega impresa: ${values.printed_delivery ? "Sí" : "No"}`,
    `- Álbum, marco, cartilla o entregable especial: ${
      values.special_deliverable ? "Sí" : "No"
    }`,
    "",
    estimate.manualAdjusted
      ? "*Cotización ajustada por Samora Studio*"
      : "*Estimación generada por la web*",
    `- Valor base estimado: ${estimate.baseLabel}`,
    `- Desplazamiento: ${travelLine}`,
    estimate.manualAdjusted
      ? `- Valor definido para enviar: *${estimate.label}*`
      : `- Rango estimado: *${estimate.label}*`,
    "",
    "*Nota importante*",
    travelNote,
    "",
    "Este valor es orientativo y debe ser confirmado por Samora Studio antes de aprobar el servicio.",
    "",
    "*Detalles adicionales*",
    values.details || "Sin detalles adicionales.",
    "",
    "--------------------------------",
    "Cotización generada desde la página web de Samora Studio.",
  ];

  return lines.join("\n");
}

function normalizePhoneForWhatsapp(phone: string | null) {
  const onlyNumbers = (phone ?? "").replace(/\D/g, "");

  if (!onlyNumbers) return "";
  if (onlyNumbers.startsWith("57")) return onlyNumbers;
  if (onlyNumbers.length === 10) return `57${onlyNumbers}`;

  return onlyNumbers;
}

function buildClientQuoteMessage(quote: QuoteRequest) {
  const customerName = quote.customer_name || "cliente";
  const finalPrice = getFinalPriceLabel(quote);

  const deliveryLines = [
    `- Entrega digital: ${quote.digital_delivery ? "Sí" : "No"}`,
    `- Entrega impresa: ${quote.printed_delivery ? "Sí" : "No"}`,
    `- Álbum, marco, cartilla o entregable especial: ${
      quote.special_deliverable ? "Sí" : "No"
    }`,
  ];

  const travelNote = quote.requires_travel_review
    ? "El valor fue revisado teniendo en cuenta que el servicio requiere desplazamiento. Si cambian la ciudad, el lugar exacto, los tiempos de traslado o las condiciones del evento, el valor puede ajustarse nuevamente."
    : "El valor puede ajustarse únicamente si cambian la fecha, el lugar, la duración, los entregables o las condiciones del servicio.";

  const lines = [
    "*SAMORA STUDIO*",
    "*Respuesta de cotización*",
    "",
    `Hola ${customerName}, gracias por contactarnos.`,
    "",
    "Te compartimos la cotización revisada para el servicio solicitado:",
    "",
    "--------------------------------",
    `*Código:* ${quote.quote_code}`,
    `*Servicio:* ${quote.service_label}`,
    `*Fecha aproximada:* ${formatDateOnly(quote.event_date)}`,
    `*Zona:* ${quote.service_zone_label}`,
    `*Lugar:* ${quote.service_location || "Por definir"}`,
    `*Duración estimada:* ${getDurationLabel(quote)}`,
    `*Cantidad aproximada:* ${
      quote.quantity ? String(quote.quantity) : "Por definir"
    }`,
    "",
    "*Valor propuesto*",
    `*${finalPrice}*`,
    "",
    "*Incluye*",
    ...deliveryLines,
    "",
    "*Nota importante*",
    travelNote,
    "",
    "Para continuar, por favor confírmanos si deseas aprobar esta cotización y revisar disponibilidad final.",
    "",
    "--------------------------------",
    "Samora Studio",
  ];

  return lines.join("\n");
}

export default function QuoteRequestsAdmin({
  initialQuotes,
}: {
  initialQuotes: QuoteRequest[];
}) {
  const supabase = createClient();

  const [quotes, setQuotes] = useState<QuoteRequest[]>(initialQuotes);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(
    initialQuotes[0] ?? null
  );
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<EditValues | null>(
    initialQuotes[0] ? createEditValues(initialQuotes[0]) : null
  );
  const [scheduleValues, setScheduleValues] = useState<ScheduleValues | null>(
    initialQuotes[0] ? createScheduleValues(initialQuotes[0]) : null
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");

  const stats = useMemo(() => {
    const total = quotes.length;
    const news = quotes.filter(
      (quote) => quote.status === "new" || quote.status === "new_travel_review"
    ).length;
    const reviewing = quotes.filter((quote) => quote.status === "reviewing")
      .length;
    const approved = quotes.filter((quote) => quote.status === "approved")
      .length;
    const scheduled = quotes.filter((quote) => quote.status === "scheduled")
      .length;

    return { total, news, reviewing, approved, scheduled };
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return quotes.filter((quote) => {
      const matchesStatus =
        statusFilter === "all" || quote.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        quote.quote_code.toLowerCase().includes(normalizedSearch) ||
        (quote.customer_name ?? "").toLowerCase().includes(normalizedSearch) ||
        (quote.customer_phone ?? "").toLowerCase().includes(normalizedSearch) ||
        quote.service_label.toLowerCase().includes(normalizedSearch) ||
        (quote.service_location ?? "").toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [quotes, search, statusFilter]);

  function selectQuote(quote: QuoteRequest) {
    setSelectedQuote(quote);
    setEditValues(createEditValues(quote));
    setScheduleValues(createScheduleValues(quote));
    setEditMode(false);
    setMessage("");
  }

  function updateLocalQuote(updatedQuote: QuoteRequest) {
    setQuotes((currentQuotes) =>
      currentQuotes.map((quote) =>
        quote.id === updatedQuote.id ? updatedQuote : quote
      )
    );

    setSelectedQuote(updatedQuote);
    setEditValues(createEditValues(updatedQuote));
    setScheduleValues(createScheduleValues(updatedQuote));
  }

  async function updateStatus(quote: QuoteRequest, newStatus: QuoteStatus) {
    setSavingId(quote.id);
    setMessage("");

    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      status: newStatus,
      updated_at: now,
    };

    if (newStatus === "approved") {
      payload.approved_at = quote.approved_at ?? now;
    }

    if (newStatus === "scheduled") {
      payload.scheduled_at = quote.scheduled_at ?? now;
    }

    const { error } = await supabase
      .from("quote_requests")
      .update(payload)
      .eq("id", quote.id);

    if (error) {
      setMessage(`No se pudo actualizar el estado: ${error.message}`);
      setSavingId("");
      return;
    }

    const updatedQuote = {
      ...quote,
      ...payload,
    } as QuoteRequest;

    updateLocalQuote(updatedQuote);

    setMessage("Estado actualizado correctamente.");
    setSavingId("");
  }

  async function saveQuoteChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedQuote || !editValues) return;

    setSavingId(selectedQuote.id);
    setMessage("");

    const selectedRule = quoteRules[editValues.service_type];
    const selectedZone = serviceZones[editValues.service_zone];
    const estimate = getEstimateFromValues(editValues);

    const durationTotalMinutes = getDurationTotalMinutes(
      editValues.duration_hours_value,
      editValues.duration_minutes_value
    );

    const durationHours = getDurationHours(
      editValues.duration_hours_value,
      editValues.duration_minutes_value
    );

    const shouldAutoUpdateStatus =
      selectedQuote.status === "new" ||
      selectedQuote.status === "new_travel_review";

    const finalStatus = shouldAutoUpdateStatus
      ? selectedZone.requiresTravelReview
        ? "new_travel_review"
        : "new"
      : selectedQuote.status;

    const finalWhatsappMessage = buildWhatsappMessageForValues(
      selectedQuote.quote_code,
      editValues
    );

    const payload: Record<string, unknown> = {
      customer_name: editValues.customer_name || null,
      customer_phone: editValues.customer_phone || null,

      service_type: editValues.service_type,
      service_label: selectedRule.label,

      event_date: editValues.event_date || null,
      service_zone: editValues.service_zone,
      service_zone_label: selectedZone.label,
      service_location: editValues.service_location || null,

      duration_value: durationTotalMinutes,
      duration_unit: "minutos_totales",
      duration_hours: durationHours,

      quantity: Number(editValues.quantity) || null,

      digital_delivery: editValues.digital_delivery,
      printed_delivery: editValues.printed_delivery,
      special_deliverable: editValues.special_deliverable,

      details: editValues.details || null,
      admin_notes: editValues.admin_notes || null,

      base_min_cop: estimate.baseMin,
      base_max_cop: estimate.baseMax,

      travel_surcharge_percent: estimate.surchargePercent,
      travel_surcharge_min_cop: estimate.surchargeMin,
      travel_surcharge_max_cop: estimate.surchargeMax,

      estimated_min_cop: estimate.totalMin,
      estimated_max_cop: estimate.totalMax,

      requires_travel_review: selectedZone.requiresTravelReview,
      requires_manual_review: true,

      whatsapp_message: finalWhatsappMessage,
      status: finalStatus,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("quote_requests")
      .update(payload)
      .eq("id", selectedQuote.id);

    if (error) {
      setMessage(`No se pudieron guardar los cambios: ${error.message}`);
      setSavingId("");
      return;
    }

    const updatedQuote = {
      ...selectedQuote,
      ...payload,
    } as QuoteRequest;

    updateLocalQuote(updatedQuote);

    setEditMode(false);
    setMessage("Cotización actualizada correctamente.");
    setSavingId("");
  }

  async function saveSchedule({
    approve = false,
  }: {
    approve?: boolean;
  } = {}) {
    if (!selectedQuote || !scheduleValues) return;

    if (
      approve &&
      (!scheduleValues.confirmed_event_date ||
        !scheduleValues.confirmed_start_time ||
        !scheduleValues.confirmed_end_time)
    ) {
      setMessage(
        "Para aprobar con agenda debes completar fecha, hora de inicio y hora de finalización."
      );
      return;
    }

    setSavingId(selectedQuote.id);
    setMessage("");

    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      confirmed_event_date: scheduleValues.confirmed_event_date || null,
      confirmed_start_time: scheduleValues.confirmed_start_time || null,
      confirmed_end_time: scheduleValues.confirmed_end_time || null,
      confirmed_timezone:
        scheduleValues.confirmed_timezone || "America/Bogota",
      confirmed_location: scheduleValues.confirmed_location || null,
      schedule_notes: scheduleValues.schedule_notes || null,
      updated_at: now,
    };

    if (approve) {
      payload.status = "approved";
      payload.approved_at = selectedQuote.approved_at ?? now;
    }

    const { error } = await supabase
      .from("quote_requests")
      .update(payload)
      .eq("id", selectedQuote.id);

    if (error) {
      setMessage(`No se pudo guardar la agenda: ${error.message}`);
      setSavingId("");
      return;
    }

    const updatedQuote = {
      ...selectedQuote,
      ...payload,
    } as QuoteRequest;

    updateLocalQuote(updatedQuote);

    setMessage(
      approve
        ? "Agenda guardada y cotización aprobada correctamente."
        : "Agenda guardada correctamente."
    );
    setSavingId("");
  }

  async function copyWhatsappMessage(quote: QuoteRequest) {
    if (!quote.whatsapp_message) {
      setMessage("Esta cotización no tiene mensaje guardado.");
      return;
    }

    await navigator.clipboard.writeText(quote.whatsapp_message);
    setMessage("Mensaje interno copiado.");
  }

  function openClientWhatsapp(quote: QuoteRequest) {
    const phone = normalizePhoneForWhatsapp(quote.customer_phone);

    if (!phone) {
      setMessage("El cliente no tiene un WhatsApp válido.");
      return;
    }

    const reply = buildClientQuoteMessage(quote);
    const link = `https://wa.me/${phone}?text=${encodeURIComponent(reply)}`;

    window.open(link, "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Nuevas" value={stats.news} />
        <StatCard label="En revisión" value={stats.reviewing} />
        <StatCard label="Aprobadas" value={stats.approved} />
        <StatCard label="Agendadas" value={stats.scheduled} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cliente, código, servicio..."
              className="admin-input"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="admin-input admin-select"
            >
              <option value="all">Todos los estados</option>
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {message && (
            <p className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-3 text-xs leading-5 text-white/55">
              {message}
            </p>
          )}

          <div className="mt-5 grid gap-3">
            {filteredQuotes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/45">
                No hay cotizaciones con estos filtros.
              </div>
            ) : (
              filteredQuotes.map((quote) => {
                const active = selectedQuote?.id === quote.id;

                return (
                  <button
                    key={quote.id}
                    type="button"
                    onClick={() => selectQuote(quote)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-white bg-white text-black"
                        : "border-white/10 bg-black/30 text-white hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] opacity-55">
                          {quote.quote_code}
                        </p>

                        <h3 className="mt-2 text-base font-semibold">
                          {quote.customer_name || "Cliente sin nombre"}
                        </h3>
                      </div>

                      <StatusBadge status={quote.status} />
                    </div>

                    <p className="mt-3 text-sm opacity-65">
                      {quote.service_label}
                    </p>

                    <p className="mt-2 text-sm font-medium">
                      {getFinalPriceLabel(quote)}
                    </p>

                    {quote.confirmed_event_date && (
                      <p
                        className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
                          active
                            ? "border-black/10 bg-black/[0.04] text-black/70"
                            : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100/80"
                        }`}
                      >
                        Agenda: {formatDateOnly(quote.confirmed_event_date)} ·{" "}
                        {formatTime(quote.confirmed_start_time)}
                      </p>
                    )}

                    {quote.requires_travel_review && (
                      <p
                        className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
                          active
                            ? "border-yellow-500/30 bg-yellow-100 text-yellow-900"
                            : "border-yellow-400/20 bg-yellow-400/10 text-yellow-100/80"
                        }`}
                      >
                        Requiere revisión por desplazamiento
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          {selectedQuote && editValues && scheduleValues ? (
            <QuoteDetail
              quote={selectedQuote}
              editMode={editMode}
              editValues={editValues}
              scheduleValues={scheduleValues}
              saving={savingId === selectedQuote.id}
              onEditValuesChange={setEditValues}
              onScheduleValuesChange={setScheduleValues}
              onToggleEdit={() => setEditMode((current) => !current)}
              onCancelEdit={() => {
                setEditValues(createEditValues(selectedQuote));
                setEditMode(false);
              }}
              onSaveChanges={saveQuoteChanges}
              onSaveSchedule={saveSchedule}
              onUpdateStatus={updateStatus}
              onCopyWhatsappMessage={copyWhatsappMessage}
              onOpenClientWhatsapp={openClientWhatsapp}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/45">
              Selecciona una cotización para ver el detalle.
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .admin-input {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          padding: 0.85rem 1rem;
          color: white;
          outline: none;
        }

        .admin-input:focus {
          border-color: rgba(255, 255, 255, 0.38);
        }

        .admin-input::placeholder {
          color: rgba(255, 255, 255, 0.3);
        }

        .admin-input option,
        .admin-select option {
          color: black;
          background: white;
        }
      `}</style>
    </div>
  );
}

function QuoteDetail({
  quote,
  editMode,
  editValues,
  scheduleValues,
  saving,
  onEditValuesChange,
  onScheduleValuesChange,
  onToggleEdit,
  onCancelEdit,
  onSaveChanges,
  onSaveSchedule,
  onUpdateStatus,
  onCopyWhatsappMessage,
  onOpenClientWhatsapp,
}: {
  quote: QuoteRequest;
  editMode: boolean;
  editValues: EditValues;
  scheduleValues: ScheduleValues;
  saving: boolean;
  onEditValuesChange: (values: EditValues) => void;
  onScheduleValuesChange: (values: ScheduleValues) => void;
  onToggleEdit: () => void;
  onCancelEdit: () => void;
  onSaveChanges: (event: FormEvent<HTMLFormElement>) => void;
  onSaveSchedule: (options?: { approve?: boolean }) => void;
  onUpdateStatus: (quote: QuoteRequest, status: QuoteStatus) => void;
  onCopyWhatsappMessage: (quote: QuoteRequest) => void;
  onOpenClientWhatsapp: (quote: QuoteRequest) => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/35">
            {quote.quote_code}
          </p>

          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            {quote.customer_name || "Cliente sin nombre"}
          </h2>

          <p className="mt-2 text-sm text-white/45">
            Creada el {formatDateTime(quote.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={quote.status} />

          <button
            type="button"
            onClick={onToggleEdit}
            className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/70 transition hover:border-white/35 hover:text-white"
          >
            {editMode ? "Cerrar edición" : "Editar cotización"}
          </button>
        </div>
      </div>

      {editMode ? (
        <QuoteEditForm
          values={editValues}
          saving={saving}
          onChange={onEditValuesChange}
          onCancel={onCancelEdit}
          onSubmit={onSaveChanges}
        />
      ) : (
        <QuoteReadView quote={quote} />
      )}

      <SchedulePanel
        values={scheduleValues}
        quote={quote}
        saving={saving}
        onChange={onScheduleValuesChange}
        onSave={() => onSaveSchedule()}
        onSaveAndApprove={() => onSaveSchedule({ approve: true })}
      />

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-white/35">
          Estado de la cotización
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {statusOptions.map((status) => {
            const active = quote.status === status.value;

            return (
              <button
                key={status.value}
                type="button"
                disabled={saving}
                onClick={() => onUpdateStatus(quote, status.value)}
                className={`rounded-full border px-4 py-2 text-xs transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/30 hover:text-white"
                }`}
              >
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onCopyWhatsappMessage(quote)}
          className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/35 hover:text-white"
        >
          Copiar mensaje interno
        </button>

        <button
          type="button"
          onClick={() => onOpenClientWhatsapp(quote)}
          className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
        >
          Enviar cotización al cliente
        </button>

        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-full border border-white/10 px-5 py-3 text-sm text-white/25 sm:col-span-2"
          title="Se activará cuando integremos Google Calendar"
        >
          Crear evento en Google Calendar
        </button>
      </div>
    </div>
  );
}

function QuoteReadView({ quote }: { quote: QuoteRequest }) {
  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Info label="WhatsApp" value={quote.customer_phone || "Sin número"} />
        <Info label="Servicio" value={quote.service_label} />
        <Info label="Fecha aproximada" value={formatDateOnly(quote.event_date)} />
        <Info label="Duración" value={getDurationLabel(quote)} />
        <Info label="Zona" value={quote.service_zone_label} />
        <Info label="Lugar exacto" value={quote.service_location || "Por definir"} />
        <Info
          label="Cantidad"
          value={quote.quantity ? String(quote.quantity) : "Por definir"}
        />
        <Info label="Valor para enviar" value={getFinalPriceLabel(quote)} />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-white/35">
          Entregables
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MiniFlag label="Digital" active={!!quote.digital_delivery} />
          <MiniFlag label="Impresa" active={!!quote.printed_delivery} />
          <MiniFlag label="Especial" active={!!quote.special_deliverable} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-white/35">
          Desplazamiento
        </p>

        <p className="mt-3 text-sm leading-6 text-white/60">
          Recargo estimado: {quote.travel_surcharge_percent}% (
          {formatCOP(quote.travel_surcharge_min_cop)} -{" "}
          {formatCOP(quote.travel_surcharge_max_cop)})
        </p>

        {quote.requires_travel_review && (
          <p className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100/80">
            Esta cotización requiere revisión manual por desplazamiento.
          </p>
        )}
      </div>

      <TextBlock title="Detalles adicionales" text={quote.details} />
      <TextBlock title="Notas internas" text={quote.admin_notes} />
    </>
  );
}

function SchedulePanel({
  values,
  quote,
  saving,
  onChange,
  onSave,
  onSaveAndApprove,
}: {
  values: ScheduleValues;
  quote: QuoteRequest;
  saving: boolean;
  onChange: (values: ScheduleValues) => void;
  onSave: () => void;
  onSaveAndApprove: () => void;
}) {
  const hasConfirmedSchedule =
    !!quote.confirmed_event_date &&
    !!quote.confirmed_start_time &&
    !!quote.confirmed_end_time;

  function updateField<Key extends keyof ScheduleValues>(
    key: Key,
    value: ScheduleValues[Key]
  ) {
    onChange({
      ...values,
      [key]: value,
    });
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/35">
            Agenda confirmada
          </p>

          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
            Fecha y hora final del servicio
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            Estos datos se usarán más adelante para crear el evento en Google
            Calendar. Usa esta sección solo cuando el cliente ya haya confirmado
            la cotización.
          </p>
        </div>

        {hasConfirmedSchedule && (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100/80">
            Agenda lista
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <EditField label="Fecha del evento">
          <input
            type="date"
            value={values.confirmed_event_date}
            onChange={(event) =>
              updateField("confirmed_event_date", event.target.value)
            }
            className="admin-input"
          />
        </EditField>

        <EditField label="Hora de inicio">
          <input
            type="time"
            value={values.confirmed_start_time}
            onChange={(event) =>
              updateField("confirmed_start_time", event.target.value)
            }
            className="admin-input"
          />
        </EditField>

        <EditField label="Hora de finalización">
          <input
            type="time"
            value={values.confirmed_end_time}
            onChange={(event) =>
              updateField("confirmed_end_time", event.target.value)
            }
            className="admin-input"
          />
        </EditField>

        <EditField label="Zona horaria">
          <input
            value={values.confirmed_timezone}
            onChange={(event) =>
              updateField("confirmed_timezone", event.target.value)
            }
            className="admin-input"
          />
        </EditField>

        <EditField label="Lugar confirmado" full>
          <input
            value={values.confirmed_location}
            onChange={(event) =>
              updateField("confirmed_location", event.target.value)
            }
            placeholder="Dirección o lugar final acordado con el cliente"
            className="admin-input"
          />
        </EditField>

        <EditField label="Notas de agenda" full>
          <textarea
            value={values.schedule_notes}
            onChange={(event) =>
              updateField("schedule_notes", event.target.value)
            }
            rows={3}
            placeholder="Ej: llevar luces, confirmar abono, llegar 30 minutos antes..."
            className="admin-input resize-none"
          />
        </EditField>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar agenda"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={onSaveAndApprove}
          className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar agenda y aprobar"}
        </button>
      </div>
    </div>
  );
}

function QuoteEditForm({
  values,
  saving,
  onChange,
  onCancel,
  onSubmit,
}: {
  values: EditValues;
  saving: boolean;
  onChange: (values: EditValues) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const estimate = getEstimateFromValues(values);
  const selectedZone = serviceZones[values.service_zone];

  function updateField<Key extends keyof EditValues>(
    key: Key,
    value: EditValues[Key]
  ) {
    onChange({
      ...values,
      [key]: value,
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6">
      <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-white/35">
          Editar información
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <EditField label="Nombre">
            <input
              value={values.customer_name}
              onChange={(event) => updateField("customer_name", event.target.value)}
              className="admin-input"
            />
          </EditField>

          <EditField label="WhatsApp">
            <input
              value={values.customer_phone}
              onChange={(event) => updateField("customer_phone", event.target.value)}
              className="admin-input"
            />
          </EditField>

          <EditField label="Servicio" full>
            <select
              value={values.service_type}
              onChange={(event) =>
                updateField("service_type", event.target.value as ServiceKey)
              }
              className="admin-input admin-select"
            >
              {serviceOptions.map((service) => (
                <option key={service.value} value={service.value}>
                  {service.label}
                </option>
              ))}
            </select>
          </EditField>

          <EditField label="Fecha aproximada">
            <input
              type="date"
              value={values.event_date}
              onChange={(event) => updateField("event_date", event.target.value)}
              className="admin-input"
            />
          </EditField>

          <EditField label="Zona">
            <select
              value={values.service_zone}
              onChange={(event) =>
                updateField("service_zone", event.target.value as ServiceZoneKey)
              }
              className="admin-input admin-select"
            >
              {zoneOptions.map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label}
                </option>
              ))}
            </select>
          </EditField>

          <EditField label="Lugar exacto" full>
            <input
              value={values.service_location}
              onChange={(event) =>
                updateField("service_location", event.target.value)
              }
              className="admin-input"
            />
            <p className="mt-2 text-xs leading-5 text-white/35">
              {selectedZone.description}
            </p>
          </EditField>

          <EditField label="Horas">
            <input
              type="number"
              min="0"
              step="1"
              value={values.duration_hours_value}
              onChange={(event) =>
                updateField("duration_hours_value", event.target.value)
              }
              className="admin-input"
            />
          </EditField>

          <EditField label="Minutos">
            <input
              type="number"
              min="0"
              max="59"
              step="1"
              value={values.duration_minutes_value}
              onChange={(event) =>
                updateField("duration_minutes_value", event.target.value)
              }
              className="admin-input"
            />
          </EditField>

          <EditField label="Cantidad" full>
            <input
              type="number"
              min="1"
              value={values.quantity}
              onChange={(event) => updateField("quantity", event.target.value)}
              className="admin-input"
            />
          </EditField>

          <EditField label="Valor mínimo / valor final">
            <input
              type="number"
              min="0"
              step="1000"
              value={values.estimated_min_cop}
              onChange={(event) =>
                updateField("estimated_min_cop", event.target.value)
              }
              placeholder="Ej: 350000"
              className="admin-input"
            />
          </EditField>

          <EditField label="Valor máximo / valor final">
            <input
              type="number"
              min="0"
              step="1000"
              value={values.estimated_max_cop}
              onChange={(event) =>
                updateField("estimated_max_cop", event.target.value)
              }
              placeholder="Ej: 450000"
              className="admin-input"
            />
          </EditField>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ToggleEdit
            label="Entrega digital"
            active={values.digital_delivery}
            onClick={() =>
              updateField("digital_delivery", !values.digital_delivery)
            }
          />

          <ToggleEdit
            label="Entrega impresa"
            active={values.printed_delivery}
            onClick={() =>
              updateField("printed_delivery", !values.printed_delivery)
            }
          />

          <ToggleEdit
            label="Álbum / marco / cartilla"
            active={values.special_deliverable}
            onClick={() =>
              updateField("special_deliverable", !values.special_deliverable)
            }
          />
        </div>

        <EditField label="Detalles adicionales" full className="mt-5 block">
          <textarea
            value={values.details}
            onChange={(event) => updateField("details", event.target.value)}
            rows={4}
            className="admin-input resize-none"
          />
        </EditField>

        <EditField label="Notas internas" full className="mt-5 block">
          <textarea
            value={values.admin_notes}
            onChange={(event) => updateField("admin_notes", event.target.value)}
            rows={3}
            placeholder="Notas solo para administración. Ej: confirmar transporte, pedir abono, ajustar precio final..."
            className="admin-input resize-none"
          />
        </EditField>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/35">
            Valor para enviar al cliente
          </p>

          <p className="mt-2 text-2xl font-semibold">{estimate.label}</p>

          <p className="mt-2 text-xs leading-5 text-white/40">
            Cálculo automático original: {estimate.autoLabel}
          </p>

          {estimate.manualAdjusted && (
            <p className="mt-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs leading-5 text-emerald-100/80">
              Este valor fue ajustado manualmente por administración.
            </p>
          )}

          <p className="mt-2 text-xs leading-5 text-white/40">
            Para enviar un precio final cerrado, coloca el mismo valor en mínimo
            y máximo. Al guardar, también se actualiza el mensaje de cotización
            para WhatsApp.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/35 hover:text-white disabled:opacity-60"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </form>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-white/35">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{value}</p>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-medium text-white/80">
        {value}
      </p>
    </div>
  );
}

function TextBlock({ title, text }: { title: string; text: string | null }) {
  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-white/35">
        {title}
      </p>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/60">
        {text || "Sin información."}
      </p>
    </div>
  );
}

function MiniFlag({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        active
          ? "border-white bg-white text-black"
          : "border-white/10 bg-white/[0.03] text-white/35"
      }`}
    >
      {label}: {active ? "Sí" : "No"}
    </div>
  );
}

function EditField({
  label,
  children,
  full = false,
  className = "",
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
  className?: string;
}) {
  return (
    <label className={`${full ? "sm:col-span-2" : ""} ${className}`}>
      <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">
        {label}
      </span>
      {children}
    </label>
  );
}

function ToggleEdit({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
        active
          ? "border-white bg-white text-black"
          : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white"
      }`}
    >
      {label}: {active ? "Sí" : "No"}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = statusLabels[status] ?? status;

  const className =
    status === "approved"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100/80"
      : status === "scheduled"
      ? "border-blue-400/20 bg-blue-400/10 text-blue-100/80"
      : status === "rejected"
      ? "border-red-400/20 bg-red-400/10 text-red-100/80"
      : status === "new_travel_review"
      ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-100/80"
      : status === "reviewing"
      ? "border-white/15 bg-white/[0.06] text-white/70"
      : "border-white/10 bg-white/[0.03] text-white/55";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs ${className}`}
    >
      {label}
    </span>
  );
}