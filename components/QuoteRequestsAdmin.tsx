"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export type QuoteStatus =
  | "new"
  | "new_travel_review"
  | "reviewing"
  | "proposal_sent"
  | "approved"
  | "reserved"
  | "completed"
  | "cancelled"
  | "scheduled"
  | "rejected";

export type MeetingStatus =
  | "pendiente_programar"
  | "programada"
  | "realizada"
  | "no_requerida"
  | "cancelada";

export type MeetingType = "por_definir" | "virtual" | "presencial" | "whatsapp";

export type ReservationStatus = "pending_deposit" | "reserved" | "no_deposit_required";
export type PaymentProvider = "manual" | "wompi";
export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "refunded" | "not_required";
export type PaymentMethod = "" | "nequi" | "transferencia" | "efectivo" | "wompi" | "otro";

export type QuoteRequest = {
  id: string;
  quote_code: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_document: string | null;
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
  guest_count: number | null;
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
  meeting_requested: boolean | null;
  meeting_type: MeetingType | string | null;
  meeting_status: MeetingStatus | string | null;
  meeting_date: string | null;
  meeting_start_time: string | null;
  meeting_end_time: string | null;
  meeting_location: string | null;
  meeting_notes: string | null;
  meeting_completed_at: string | null;
  internal_pricing_notes: string | null;
  selected_package: string | null;
  final_price_cop: number | null;
  final_quote_sent_at: string | null;
  final_pdf_url: string | null;
  reservation_status: ReservationStatus | string | null;
  deposit_required_cop: number | null;
  deposit_paid_cop: number | null;
  payment_method: PaymentMethod | string | null;
  payment_provider: PaymentProvider | string | null;
  payment_reference: string | null;
  payment_status: PaymentStatus | string | null;
  paid_at: string | null;
  reservation_confirmed_at: string | null;
  reservation_notes: string | null;
  source: string | null;
  created_at: string;
  updated_at: string | null;
};

type ServiceKey =
  | "matrimonio_boda"
  | "quince_anos"
  | "bautizo"
  | "cumpleanos"
  | "grados_escolares"
  | "evento_empresarial"
  | "retrato_individual"
  | "pareja_embarazo"
  | "familiar"
  | "mascotas"
  | "producto"
  | "gastronomia"
  | "hospedaje_espacios"
  | "impresiones"
  | "web_software"
  | "otro"
  | "sesion_individual"
  | "evento_social"
  | "grados"
  | "producto_marca";

type ServiceZoneKey =
  | "guatavita"
  | "sabana_norte"
  | "bogota"
  | "cundinamarca_lejano"
  | "fuera_cundinamarca"
  | "especial_fuera_cobertura"
  | "municipio_cercano"
  | "bogota_sabana";

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
  customer_email: string;
  customer_document: string;
  service_type: ServiceKey;
  event_date: string;
  service_zone: ServiceZoneKey;
  service_location: string;
  duration_hours_value: string;
  duration_minutes_value: string;
  quantity: string;
  guest_count: string;
  digital_delivery: boolean;
  printed_delivery: boolean;
  special_deliverable: boolean;
  selected_package: string;
  final_price_cop: string;
  details: string;
  admin_notes: string;
  internal_pricing_notes: string;
};

type MeetingValues = {
  meeting_requested: boolean;
  meeting_type: MeetingType;
  meeting_status: MeetingStatus;
  meeting_date: string;
  meeting_start_time: string;
  meeting_end_time: string;
  meeting_location: string;
  meeting_notes: string;
};

type ScheduleValues = {
  confirmed_event_date: string;
  confirmed_start_time: string;
  confirmed_end_time: string;
  confirmed_timezone: string;
  confirmed_location: string;
  schedule_notes: string;
};

type ReservationValues = {
  reservation_status: ReservationStatus;
  deposit_required_cop: string;
  deposit_paid_cop: string;
  payment_method: PaymentMethod;
  payment_provider: PaymentProvider;
  payment_reference: string;
  payment_status: PaymentStatus;
  paid_at: string;
  reservation_notes: string;
};

const quoteRules: Record<ServiceKey, QuoteRule> = {
  matrimonio_boda: { label: "Matrimonio / boda", min: 1250000, max: 1800000, perHourMin: 90000, perHourMax: 160000 },
  quince_anos: { label: "Quince años", min: 650000, max: 1800000, perHourMin: 90000, perHourMax: 160000 },
  bautizo: { label: "Bautizo", min: 450000, max: 1200000, perHourMin: 80000, perHourMax: 140000 },
  cumpleanos: { label: "Cumpleaños", min: 380000, max: 1200000, perHourMin: 70000, perHourMax: 130000 },
  grados_escolares: { label: "Grados / eventos escolares", min: 700000, max: 1600000, perUnitMin: 22000, perUnitMax: 45000, unitLabel: "estudiante" },
  evento_empresarial: { label: "Evento empresarial", min: 650000, max: 1800000, perHourMin: 90000, perHourMax: 160000 },
  retrato_individual: { label: "Retrato individual / profesional", min: 180000, max: 350000, perHourMin: 40000, perHourMax: 70000 },
  pareja_embarazo: { label: "Pareja / embarazo", min: 220000, max: 480000, perHourMin: 50000, perHourMax: 90000 },
  familiar: { label: "Sesión familiar", min: 220000, max: 520000, perHourMin: 50000, perHourMax: 90000 },
  mascotas: { label: "Mascotas", min: 160000, max: 320000, perHourMin: 40000, perHourMax: 70000 },
  producto: { label: "Fotografía de producto", min: 250000, max: 750000, perUnitMin: 25000, perUnitMax: 60000, unitLabel: "producto/foto" },
  gastronomia: { label: "Fotografía gastronómica / coctelería", min: 250000, max: 850000, perUnitMin: 25000, perUnitMax: 60000, unitLabel: "producto/foto" },
  hospedaje_espacios: { label: "Hospedajes / espacios / inmobiliaria", min: 280000, max: 950000, perUnitMin: 25000, perUnitMax: 70000, unitLabel: "espacio/foto" },
  impresiones: { label: "Impresiones / marcos / recuerdos", min: 30000, max: 180000, perUnitMin: 15000, perUnitMax: 80000, unitLabel: "unidad" },
  web_software: { label: "Desarrollo web / software", min: 800000, max: 4500000 },
  otro: { label: "Otro servicio personalizado", min: 250000, max: 1800000 },
  sesion_individual: { label: "Sesión individual / retrato", min: 180000, max: 350000, perHourMin: 40000, perHourMax: 70000 },
  evento_social: { label: "Evento social / empresarial", min: 650000, max: 1800000, perHourMin: 90000, perHourMax: 160000 },
  grados: { label: "Grados / colegio", min: 700000, max: 1600000, perUnitMin: 22000, perUnitMax: 45000, unitLabel: "estudiante" },
  producto_marca: { label: "Fotografía de producto / gastronomía", min: 250000, max: 750000, perUnitMin: 25000, perUnitMax: 60000, unitLabel: "producto/foto" },
};

const serviceZones: Record<ServiceZoneKey, ServiceZoneRule> = {
  guatavita: { label: "Guatavita", description: "Servicio dentro de Guatavita.", surchargePercent: 0, requiresTravelReview: false },
  sabana_norte: { label: "Sabana norte", description: "Sesquilé, Guasca, Sopó, Tocancipá, Gachancipá, Chía, Cajicá, Zipaquirá y alrededores.", surchargePercent: 10, requiresTravelReview: false },
  bogota: { label: "Bogotá", description: "Servicio dentro de Bogotá o zonas urbanas cercanas.", surchargePercent: 10, requiresTravelReview: false },
  cundinamarca_lejano: { label: "Cundinamarca lejano", description: "Municipios más alejados dentro de Cundinamarca.", surchargePercent: 25, requiresTravelReview: false },
  fuera_cundinamarca: { label: "Fuera de Cundinamarca", description: "Servicios fuera de Cundinamarca con desplazamiento estándar.", surchargePercent: 30, requiresTravelReview: false },
  especial_fuera_cobertura: { label: "Solicitud especial / destino lejano", description: "Cartagena, Costa, otra ciudad lejana o servicio con vuelos, hospedaje o logística especial.", surchargePercent: 0, requiresTravelReview: true },
  municipio_cercano: { label: "Municipio cercano", description: "Sesquilé, Guasca, Sopó, Tocancipá, Gachancipá o alrededores.", surchargePercent: 10, requiresTravelReview: false },
  bogota_sabana: { label: "Bogotá / Sabana", description: "Bogotá, Chía, Cajicá, Zipaquirá u otras zonas de la sabana.", surchargePercent: 10, requiresTravelReview: false },
};

const statusOptions: { value: QuoteStatus; label: string }[] = [
  { value: "new", label: "Nueva" },
  { value: "new_travel_review", label: "Revisión desplazamiento" },
  { value: "reviewing", label: "En revisión" },
  { value: "proposal_sent", label: "Propuesta enviada" },
  { value: "approved", label: "Aprobada" },
  { value: "reserved", label: "Reservada" },
  { value: "completed", label: "Finalizada" },
  { value: "cancelled", label: "Cancelada" },
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
  pendiente_programar: "Pendiente por programar",
  programada: "Programada",
  realizada: "Realizada",
  no_requerida: "No requerida",
  cancelada: "Cancelada",
};

const meetingTypeLabels: Record<string, string> = {
  por_definir: "Por definir",
  virtual: "Virtual",
  presencial: "Presencial",
  whatsapp: "WhatsApp",
};

const reservationStatusLabels: Record<string, string> = {
  pending_deposit: "Pendiente de abono",
  reserved: "Reservada",
  no_deposit_required: "Sin abono requerido",
};

const paymentProviderLabels: Record<string, string> = {
  manual: "Manual",
  wompi: "Wompi",
};

const paymentMethodLabels: Record<string, string> = {
  "": "Por definir",
  nequi: "Nequi",
  transferencia: "Transferencia",
  efectivo: "Efectivo",
  wompi: "Wompi",
  otro: "Otro",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  failed: "Fallido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  not_required: "No requerido",
};

const serviceOptions = Object.entries(quoteRules).map(([value, rule]) => ({ value: value as ServiceKey, label: rule.label }));
const zoneOptions = Object.entries(serviceZones).map(([value, zone]) => ({ value: value as ServiceZoneKey, label: zone.label }));

function formatCOP(value: number | null | undefined) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value ?? 0));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "Por definir";
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Por definir";
  return value.slice(0, 5);
}

function formatTimeReadable(value: string | null | undefined) {
  if (!value) return "Por definir";

  const [rawHours, rawMinutes] = value.slice(0, 5).split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value.slice(0, 5);
  }

  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(2000, 0, 1, hours, minutes));
}

function getMeetingDateLabel(value: string | null | undefined) {
  return value ? formatDateOnly(value) : "Por definir";
}

function getMeetingTimeRangeLabel(start: string | null | undefined, end: string | null | undefined) {
  if (!start && !end) return "Por definir";
  if (start && end) return `${formatTimeReadable(start)} - ${formatTimeReadable(end)}`;
  return formatTimeReadable(start ?? end);
}

function getMeetingLocationLabel(type: MeetingType, location: string | null | undefined) {
  if (location?.trim()) return location.trim();
  if (type === "virtual") return "Enlace por definir";
  if (type === "presencial") return "Lugar por definir";
  if (type === "whatsapp") return "Continuaremos por WhatsApp";
  return "Por definir";
}

function parseCOPInput(value: string) {
  return Math.max(Number(value.replace(/\D/g, "")) || 0, 0);
}

function toServiceKey(value: string | null | undefined): ServiceKey {
  if (value && value in quoteRules) return value as ServiceKey;
  return "matrimonio_boda";
}

function toZoneKey(value: string | null | undefined): ServiceZoneKey {
  if (value && value in serviceZones) return value as ServiceZoneKey;
  return "guatavita";
}

function toMeetingType(value: string | null | undefined): MeetingType {
  if (value === "virtual" || value === "presencial" || value === "whatsapp") return value;
  return "por_definir";
}

function toMeetingStatus(value: string | null | undefined): MeetingStatus {
  if (value === "programada" || value === "realizada" || value === "no_requerida" || value === "cancelada") return value;
  return "pendiente_programar";
}

function toReservationStatus(value: string | null | undefined): ReservationStatus {
  if (value === "reserved" || value === "no_deposit_required") return value;
  return "pending_deposit";
}

function toPaymentProvider(value: string | null | undefined): PaymentProvider {
  return value === "wompi" ? "wompi" : "manual";
}

function toPaymentStatus(value: string | null | undefined): PaymentStatus {
  if (value === "paid" || value === "failed" || value === "cancelled" || value === "refunded" || value === "not_required") return value;
  return "pending";
}

function toPaymentMethod(value: string | null | undefined): PaymentMethod {
  if (value === "nequi" || value === "transferencia" || value === "efectivo" || value === "wompi" || value === "otro") return value;
  return "";
}

function toDatetimeLocalValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function getDurationFromQuote(quote: QuoteRequest) {
  const totalMinutes = Number(quote.duration_value ?? 0);
  if (quote.duration_unit === "minutos_totales" && totalMinutes > 0) {
    return { hoursValue: String(Math.floor(totalMinutes / 60)), minutesValue: String(totalMinutes % 60) };
  }
  if (quote.duration_hours && quote.duration_hours > 0) {
    const hours = Math.floor(Number(quote.duration_hours));
    const minutes = Math.round((Number(quote.duration_hours) - hours) * 60);
    return { hoursValue: String(hours), minutesValue: String(minutes) };
  }
  return { hoursValue: "0", minutesValue: "0" };
}

function createEditValues(quote: QuoteRequest): EditValues {
  const duration = getDurationFromQuote(quote);
  return {
    customer_name: quote.customer_name ?? "",
    customer_phone: quote.customer_phone ?? "",
    customer_email: quote.customer_email ?? "",
    customer_document: quote.customer_document ?? "",
    service_type: toServiceKey(quote.service_type),
    event_date: quote.event_date ?? "",
    service_zone: toZoneKey(quote.service_zone),
    service_location: quote.service_location ?? "",
    duration_hours_value: duration.hoursValue,
    duration_minutes_value: duration.minutesValue,
    quantity: quote.quantity ? String(quote.quantity) : "1",
    guest_count: quote.guest_count ? String(quote.guest_count) : "",
    digital_delivery: !!quote.digital_delivery,
    printed_delivery: !!quote.printed_delivery,
    special_deliverable: !!quote.special_deliverable,
    selected_package: quote.selected_package ?? "",
    final_price_cop: quote.final_price_cop ? String(quote.final_price_cop) : "",
    details: quote.details ?? "",
    admin_notes: quote.admin_notes ?? "",
    internal_pricing_notes: quote.internal_pricing_notes ?? "",
  };
}

function createMeetingValues(quote: QuoteRequest): MeetingValues {
  return {
    meeting_requested: quote.meeting_requested ?? true,
    meeting_type: toMeetingType(quote.meeting_type),
    meeting_status: toMeetingStatus(quote.meeting_status),
    meeting_date: quote.meeting_date ?? "",
    meeting_start_time: quote.meeting_start_time?.slice(0, 5) ?? "",
    meeting_end_time: quote.meeting_end_time?.slice(0, 5) ?? "",
    meeting_location: quote.meeting_location ?? "",
    meeting_notes: quote.meeting_notes ?? "",
  };
}

function createScheduleValues(quote: QuoteRequest): ScheduleValues {
  return {
    confirmed_event_date: quote.confirmed_event_date ?? "",
    confirmed_start_time: quote.confirmed_start_time?.slice(0, 5) ?? "",
    confirmed_end_time: quote.confirmed_end_time?.slice(0, 5) ?? "",
    confirmed_timezone: quote.confirmed_timezone ?? "America/Bogota",
    confirmed_location: quote.confirmed_location ?? quote.service_location ?? "",
    schedule_notes: quote.schedule_notes ?? "",
  };
}

function createReservationValues(quote: QuoteRequest): ReservationValues {
  return {
    reservation_status: toReservationStatus(quote.reservation_status),
    deposit_required_cop: quote.deposit_required_cop ? String(quote.deposit_required_cop) : "",
    deposit_paid_cop: quote.deposit_paid_cop ? String(quote.deposit_paid_cop) : "",
    payment_method: toPaymentMethod(quote.payment_method),
    payment_provider: toPaymentProvider(quote.payment_provider),
    payment_reference: quote.payment_reference ?? "",
    payment_status: toPaymentStatus(quote.payment_status),
    paid_at: toDatetimeLocalValue(quote.paid_at),
    reservation_notes: quote.reservation_notes ?? "",
  };
}

function getDurationHours(hoursValue: string, minutesValue: string) {
  const hours = Math.max(Number(hoursValue) || 0, 0);
  const minutes = Math.max(Number(minutesValue) || 0, 0);
  return hours + minutes / 60;
}

function getBillableHours(durationHours: number) {
  if (durationHours <= 0) return 4;
  return Math.max(durationHours, 4);
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
  if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "minuto" : "minutos"}`);
  return parts.join(" y ");
}

function getDurationLabel(quote: QuoteRequest) {
  return getDurationLabelFromValues(createEditValues(quote));
}

function getInternalReferenceLabel(quote: QuoteRequest) {
  if (quote.estimated_min_cop === quote.estimated_max_cop) return formatCOP(quote.estimated_min_cop);
  return `${formatCOP(quote.estimated_min_cop)} - ${formatCOP(quote.estimated_max_cop)}`;
}

function getEstimateFromValues(values: EditValues) {
  const selectedRule = quoteRules[values.service_type];
  const selectedZone = serviceZones[values.service_zone];
  const durationHours = getDurationHours(values.duration_hours_value, values.duration_minutes_value);
  const billableHours = getBillableHours(durationHours);
  const parsedQuantity = Math.max(Number(values.quantity) || 0, 0);

  let baseMin = selectedRule.min;
  let baseMax = selectedRule.max;

  if (selectedRule.perHourMin && billableHours > 4) {
    const extraHours = billableHours - 4;
    baseMin += extraHours * selectedRule.perHourMin;
    baseMax += extraHours * (selectedRule.perHourMax ?? selectedRule.perHourMin);
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

  const surchargePercent = selectedZone.requiresTravelReview ? 0 : selectedZone.surchargePercent;
  const surchargeMin = baseMin * (surchargePercent / 100);
  const surchargeMax = baseMax * (surchargePercent / 100);
  const autoTotalMin = Math.round(baseMin + surchargeMin);
  const autoTotalMax = Math.round(baseMax + surchargeMax);
  const finalPrice = parseCOPInput(values.final_price_cop);

  const notes: string[] = [];
  if (durationHours > 0 && durationHours < 4) notes.push("El cliente solicitó menos de 4 horas. Aplicar mínimo interno de 4 horas por preparación, trabajo y desplazamiento.");
  if (durationHours > 8) notes.push("El cliente solicitó más de 8 horas. Revisar recargo, disponibilidad del equipo, alimentación, transporte y condiciones especiales.");
  if (selectedZone.requiresTravelReview) notes.push("Destino especial o fuera de cobertura estándar. No aplicar porcentaje fijo; revisar transporte, hospedaje, vuelos, alimentación, tiempos de traslado y disponibilidad.");
  else if (selectedZone.surchargePercent > 0) notes.push(`Recargo interno de desplazamiento sugerido: ${selectedZone.surchargePercent}%.`);
  notes.push(`Horas facturables internas de referencia: ${billableHours}.`);
  notes.push("No mostrar valores al cliente hasta confirmar detalles y enviar cotización final.");

  return {
    baseMin: Math.round(baseMin),
    baseMax: Math.round(baseMax),
    surchargePercent,
    surchargeMin: Math.round(surchargeMin),
    surchargeMax: Math.round(surchargeMax),
    autoTotalMin,
    autoTotalMax,
    finalPrice,
    label: autoTotalMin === autoTotalMax ? formatCOP(autoTotalMin) : `${formatCOP(autoTotalMin)} - ${formatCOP(autoTotalMax)}`,
    finalLabel: finalPrice > 0 ? formatCOP(finalPrice) : "Sin valor final definido",
    pricingNotes: notes.join("\n"),
  };
}

function buildWhatsappMessageForValues(quoteCode: string, values: EditValues, meetingValues?: MeetingValues) {
  const selectedRule = quoteRules[values.service_type];
  const selectedZone = serviceZones[values.service_zone];
  const estimate = getEstimateFromValues(values);
  const quantityLabel = selectedRule.unitLabel ? `${values.quantity || "Por definir"} ${selectedRule.unitLabel}(s)` : `${values.quantity || "Por definir"}`;

  return [
    "*SAMORA ESTUDIO*",
    "*Solicitud de cotización actualizada*",
    "",
    "--------------------------------",
    `*Código:* ${quoteCode}`,
    `*Cliente:* ${values.customer_name || "Por completar"}`,
    `*WhatsApp:* ${values.customer_phone || "Por completar"}`,
    `*Correo:* ${values.customer_email || "Por completar"}`,
    `*Documento:* ${values.customer_document || "Por completar"}`,
    "",
    "*Servicio solicitado*",
    `- Tipo: ${selectedRule.label}`,
    `- Fecha aproximada: ${values.event_date || "Por definir"}`,
    `- Zona: ${selectedZone.label}`,
    `- Lugar exacto: ${values.service_location || "Por definir"}`,
    `- Duración estimada: ${getDurationLabelFromValues(values)}`,
    `- Cantidad aproximada: ${quantityLabel}`,
    `- Invitados: ${values.guest_count || "No indicado"}`,
    "",
    "*Entregables solicitados*",
    `- Entrega digital: ${values.digital_delivery ? "Sí" : "No"}`,
    `- Entrega impresa: ${values.printed_delivery ? "Sí" : "No"}`,
    `- Álbum, marco, cartilla o entregable especial: ${values.special_deliverable ? "Sí" : "No"}`,
    "",
    "*Reunión de definición*",
    `- Tipo: ${meetingTypeLabels[meetingValues?.meeting_type ?? "por_definir"]}`,
    `- Estado: ${meetingStatusLabels[meetingValues?.meeting_status ?? "pendiente_programar"]}`,
    meetingValues?.meeting_date ? `- Fecha: ${formatDateOnly(meetingValues.meeting_date)}` : "- Fecha: Por definir",
    meetingValues?.meeting_start_time ? `- Hora: ${formatTime(meetingValues.meeting_start_time)}` : "- Hora: Por definir",
    "",
    "*Referencia interna*",
    `- Rango sugerido interno: ${estimate.label}`,
    `- Valor final definido: ${estimate.finalLabel}`,
    "No enviar valores al cliente hasta confirmar detalles y cotización final.",
    "",
    "*Detalles adicionales*",
    values.details || "Sin detalles adicionales.",
    "",
    "--------------------------------",
    "Solicitud generada desde el panel de Samora Estudio.",
  ].join("\n");
}

function normalizePhoneForWhatsapp(phone: string | null) {
  const onlyNumbers = (phone ?? "").replace(/\D/g, "");
  if (!onlyNumbers) return "";
  if (onlyNumbers.startsWith("57")) return onlyNumbers;
  if (onlyNumbers.length === 10) return `57${onlyNumbers}`;
  return onlyNumbers;
}

function buildClientMeetingMessage(quote: QuoteRequest, meetingValues?: MeetingValues) {
  const customerName = quote.customer_name || "gracias por contactarnos";
  const meetingType = meetingValues?.meeting_type ?? toMeetingType(quote.meeting_type);
  const meetingDate = meetingValues?.meeting_date ?? quote.meeting_date;
  const meetingStartTime = meetingValues?.meeting_start_time ?? quote.meeting_start_time;
  const meetingEndTime = meetingValues?.meeting_end_time ?? quote.meeting_end_time;
  const meetingLocation = meetingValues?.meeting_location ?? quote.meeting_location;
  const meetingNotes = meetingValues?.meeting_notes ?? quote.meeting_notes;

  if (meetingType === "virtual") {
    return [
      "*SAMORA ESTUDIO*",
      "*Reunión virtual programada*",
      "",
      `Hola ${customerName}, gracias por tu solicitud.`,
      "",
      "Ya tenemos programada la reunión virtual para definir los detalles de tu cotización.",
      "",
      `*Fecha:* ${getMeetingDateLabel(meetingDate)}`,
      `*Hora:* ${getMeetingTimeRangeLabel(meetingStartTime, meetingEndTime)}`,
      `*Enlace:* ${getMeetingLocationLabel(meetingType, meetingLocation)}`,
      "",
      "En esta reunión revisaremos fecha, lugar, duración, entregables, servicios adicionales, disponibilidad, condiciones y valor final.",
      meetingNotes ? `\n*Notas:* ${meetingNotes}` : "",
      "",
      `*Código de solicitud:* ${quote.quote_code}`,
      "",
      "Samora Estudio",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (meetingType === "presencial") {
    return [
      "*SAMORA ESTUDIO*",
      "*Reunión presencial programada*",
      "",
      `Hola ${customerName}, gracias por tu solicitud.`,
      "",
      "Ya tenemos programada la reunión presencial para definir los detalles de tu cotización.",
      "",
      `*Fecha:* ${getMeetingDateLabel(meetingDate)}`,
      `*Hora:* ${getMeetingTimeRangeLabel(meetingStartTime, meetingEndTime)}`,
      `*Lugar:* ${getMeetingLocationLabel(meetingType, meetingLocation)}`,
      "",
      "En esta reunión revisaremos fecha, lugar, duración, entregables, servicios adicionales, disponibilidad, condiciones y valor final.",
      meetingNotes ? `\n*Notas:* ${meetingNotes}` : "",
      "",
      `*Código de solicitud:* ${quote.quote_code}`,
      "",
      "Samora Estudio",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (meetingType === "whatsapp") {
    const scheduleLines = meetingDate || meetingStartTime
      ? [
          "",
          "*Horario sugerido para continuar por WhatsApp:*",
          `*Fecha:* ${getMeetingDateLabel(meetingDate)}`,
          `*Hora:* ${getMeetingTimeRangeLabel(meetingStartTime, meetingEndTime)}`,
        ]
      : [];

    return [
      "*SAMORA ESTUDIO*",
      "*Revisión de cotización por WhatsApp*",
      "",
      `Hola ${customerName}, gracias por tu solicitud.`,
      "",
      "Podemos continuar la revisión de tu cotización por este medio.",
      "",
      "Para definir la propuesta final revisaremos fecha, lugar, duración, entregables, servicios adicionales, disponibilidad, condiciones y valor final.",
      ...scheduleLines,
      meetingNotes ? `\n*Notas:* ${meetingNotes}` : "",
      "",
      `*Código de solicitud:* ${quote.quote_code}`,
      "",
      "Samora Estudio",
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    "*SAMORA ESTUDIO*",
    "*Coordinación de reunión*",
    "",
    `Hola ${customerName}, gracias por compartirnos la información de tu solicitud.`,
    "",
    "Para preparar una cotización precisa, queremos coordinar una reunión breve con el equipo de Samora Estudio.",
    "",
    "Puede ser virtual, presencial o por WhatsApp, según tu disponibilidad. En ella definiremos fecha, lugar, tiempos, entregables, servicios adicionales, condiciones y valor final.",
    "",
    `*Código de solicitud:* ${quote.quote_code}`,
    "",
    "Samora Estudio",
  ].join("\n");
}

function buildClientFinalQuoteMessage(quote: QuoteRequest) {
  const customerName = quote.customer_name || "gracias por contactarnos";
  const finalPrice = quote.final_price_cop
    ? formatCOP(quote.final_price_cop)
    : "Por definir";

  return [
    "*SAMORA ESTUDIO*",
    "*Propuesta personalizada*",
    "",
    `Hola ${customerName}, gracias por esperar mientras revisábamos tu solicitud.`,
    "",
    `Te compartimos la propuesta personalizada preparada por el equipo de Samora Estudio para el servicio de *${quote.service_label}*.`,
    "",
    "En el PDF adjunto encontrarás el alcance del servicio, entregables, condiciones, valor final y detalles importantes para continuar con la reserva.",
    "",
    `*Código:* ${quote.quote_code}`,
    `*Servicio:* ${quote.service_label}`,
    `*Fecha:* ${formatDateOnly(quote.event_date)}`,
    `*Lugar:* ${quote.service_location || "Por definir"}`,
    `*Duración:* ${getDurationLabel(quote)}`,
    quote.guest_count ? `*Invitados:* ${quote.guest_count}` : "",
    quote.selected_package ? `*Paquete:* ${quote.selected_package}` : "",
    `*Valor final:* ${finalPrice}`,
    "",
    "Por favor revisa la propuesta y confírmanos si deseas aprobarla para coordinar la agenda final del servicio.",
    "",
    "Quedamos atentos a cualquier ajuste o duda.",
    "",
    "Samora Estudio",
  ]
    .filter(Boolean)
    .join("\n");
}

type QuoteQuickMessageType =
  | "approval_deposit"
  | "payment_proof"
  | "reservation_confirmed"
  | "service_reminder"
  | "reservation_receipt"
  | "service_completed";

function getPublicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://samoraestudiocreativo.com"
  ).replace(/\/$/, "");
}

function getQuoteTrackingUrl(code: string) {
  return `${getPublicSiteUrl()}/seguimiento?code=${encodeURIComponent(code)}`;
}

function getConfirmedEventDateLabel(quote: QuoteRequest) {
  return formatDateOnly(quote.confirmed_event_date || quote.event_date);
}

function getConfirmedEventTimeLabel(quote: QuoteRequest) {
  if (quote.confirmed_start_time && quote.confirmed_end_time) {
    return `${formatTimeReadable(quote.confirmed_start_time)} - ${formatTimeReadable(
      quote.confirmed_end_time
    )}`;
  }

  if (quote.confirmed_start_time) {
    return formatTimeReadable(quote.confirmed_start_time);
  }

  return "Por definir";
}

function getConfirmedEventLocationLabel(quote: QuoteRequest) {
  return quote.confirmed_location || quote.service_location || "Por definir";
}

function getDepositPendingValue(quote: QuoteRequest) {
  return Math.max(
    Number(quote.deposit_required_cop ?? 0) - Number(quote.deposit_paid_cop ?? 0),
    0
  );
}

function buildQuoteQuickWhatsappMessage(
  quote: QuoteRequest,
  type: QuoteQuickMessageType
) {
  const customerName = quote.customer_name || "gracias por contactarnos";
  const trackingUrl = getQuoteTrackingUrl(quote.quote_code);
  const finalPrice = quote.final_price_cop
    ? formatCOP(quote.final_price_cop)
    : "Por definir";
  const depositRequired = formatCOP(quote.deposit_required_cop);
  const depositPaid = formatCOP(quote.deposit_paid_cop);
  const depositPending = formatCOP(getDepositPendingValue(quote));
  const paymentMethod = `${paymentProviderLabels[quote.payment_provider ?? "manual"] ?? "Manual"} · ${
    paymentMethodLabels[quote.payment_method ?? ""] ?? "Por definir"
  }`;

  if (type === "approval_deposit") {
    return [
      "*SAMORA ESTUDIO*",
      "*Confirmación de propuesta y reserva*",
      "",
      `Hola ${customerName}, esperamos que hayas podido revisar la propuesta personalizada.`,
      "",
      "Para continuar, por favor confírmanos si apruebas la propuesta. Una vez aprobada, coordinamos el abono correspondiente para reservar la fecha del servicio.",
      "",
      `*Código:* ${quote.quote_code}`,
      `*Servicio:* ${quote.service_label}`,
      `*Valor final:* ${finalPrice}`,
      `*Abono requerido:* ${depositRequired}`,
      `*Abono pendiente:* ${depositPending}`,
      `*Método de pago:* ${paymentMethod}`,
      "",
      `Puedes consultar el seguimiento aquí: ${trackingUrl}`,
      "",
      "Quedamos atentos a tu confirmación.",
      "",
      "Samora Estudio",
    ].join("\n");
  }

  if (type === "payment_proof") {
    return [
      "*SAMORA ESTUDIO*",
      "*Comprobante de abono*",
      "",
      `Hola ${customerName}, para confirmar la reserva del servicio necesitamos validar el abono acordado.`,
      "",
      `*Código:* ${quote.quote_code}`,
      `*Servicio:* ${quote.service_label}`,
      `*Abono requerido:* ${depositRequired}`,
      `*Abonado registrado:* ${depositPaid}`,
      `*Abono pendiente:* ${depositPending}`,
      `*Método de pago:* ${paymentMethod}`,
      "",
      "Por favor envíanos el comprobante de pago por este chat para dejar la reserva confirmada.",
      "",
      `Seguimiento: ${trackingUrl}`,
      "",
      "Samora Estudio",
    ].join("\n");
  }

  if (type === "reservation_confirmed") {
    return [
      "*SAMORA ESTUDIO*",
      "*Reserva confirmada*",
      "",
      `Hola ${customerName}, tu reserva quedó confirmada correctamente.`,
      "",
      `*Código:* ${quote.quote_code}`,
      `*Servicio:* ${quote.service_label}`,
      `*Fecha:* ${getConfirmedEventDateLabel(quote)}`,
      `*Hora:* ${getConfirmedEventTimeLabel(quote)}`,
      `*Lugar:* ${getConfirmedEventLocationLabel(quote)}`,
      `*Valor final:* ${finalPrice}`,
      `*Abono registrado:* ${depositPaid}`,
      "",
      "Más adelante, si hace falta, te contactaremos para ultimar detalles del servicio.",
      "",
      `Puedes consultar el seguimiento aquí: ${trackingUrl}`,
      "",
      "Samora Estudio",
    ].join("\n");
  }

  if (type === "reservation_receipt") {
    return [
      "*SAMORA ESTUDIO*",
      "*Constancia de reserva*",
      "",
      `Hola ${customerName}, te compartimos la constancia de reserva de tu servicio.`,
      "",
      "En el PDF adjunto encontrarás el resumen de la reserva, fecha, hora, lugar, valor final, abono registrado y saldo pendiente si aplica.",
      "",
      `*Código:* ${quote.quote_code}`,
      `*Servicio:* ${quote.service_label}`,
      `*Fecha:* ${getConfirmedEventDateLabel(quote)}`,
      `*Hora:* ${getConfirmedEventTimeLabel(quote)}`,
      `*Lugar:* ${getConfirmedEventLocationLabel(quote)}`,
      `*Valor final:* ${finalPrice}`,
      `*Abono registrado:* ${depositPaid}`,
      `*Saldo pendiente:* ${depositPending}`,
      "",
      `Puedes consultar el seguimiento aquí: ${trackingUrl}`,
      "",
      "Samora Estudio",
    ].join("\n");
  }

  if (type === "service_reminder") {
    return [
      "*SAMORA ESTUDIO*",
      "*Recordatorio del servicio*",
      "",
      `Hola ${customerName}, te recordamos los detalles del servicio reservado con Samora Estudio.`,
      "",
      `*Código:* ${quote.quote_code}`,
      `*Servicio:* ${quote.service_label}`,
      `*Fecha:* ${getConfirmedEventDateLabel(quote)}`,
      `*Hora:* ${getConfirmedEventTimeLabel(quote)}`,
      `*Lugar:* ${getConfirmedEventLocationLabel(quote)}`,
      "",
      "Por favor avísanos si hay algún cambio importante en la hora, ubicación o condiciones del servicio.",
      "",
      `Seguimiento: ${trackingUrl}`,
      "",
      "Samora Estudio",
    ].join("\n");
  }

  return [
    "*SAMORA ESTUDIO*",
    "*Servicio finalizado*",
    "",
    `Hola ${customerName}, gracias por permitirnos acompañar este servicio.`,
    "",
    `*Código:* ${quote.quote_code}`,
    `*Servicio:* ${quote.service_label}`,
    "",
    "Esperamos que la experiencia haya sido muy especial. Te estaremos compartiendo o coordinando la entrega del material según lo acordado.",
    "",
    "Gracias por confiar en Samora Estudio.",
    "",
    `Seguimiento: ${trackingUrl}`,
    "",
    "Samora Estudio",
  ].join("\n");
}

export default function QuoteRequestsAdmin({ initialQuotes }: { initialQuotes: QuoteRequest[] }) {
  const supabase = createClient();
  const [quotes, setQuotes] = useState<QuoteRequest[]>(initialQuotes);
  const [selectedQuote, setSelectedQuote] = useState<QuoteRequest | null>(initialQuotes[0] ?? null);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<EditValues | null>(initialQuotes[0] ? createEditValues(initialQuotes[0]) : null);
  const [meetingValues, setMeetingValues] = useState<MeetingValues | null>(initialQuotes[0] ? createMeetingValues(initialQuotes[0]) : null);
  const [scheduleValues, setScheduleValues] = useState<ScheduleValues | null>(initialQuotes[0] ? createScheduleValues(initialQuotes[0]) : null);
  const [reservationValues, setReservationValues] = useState<ReservationValues | null>(initialQuotes[0] ? createReservationValues(initialQuotes[0]) : null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");

  const stats = useMemo(() => {
    const total = quotes.length;
    const news = quotes.filter((quote) => quote.status === "new" || quote.status === "new_travel_review").length;
    const proposalSent = quotes.filter((quote) => quote.status === "proposal_sent").length;
    const approved = quotes.filter((quote) => quote.status === "approved").length;
    const reserved = quotes.filter((quote) => quote.status === "reserved" || quote.reservation_status === "reserved").length;
    return { total, news, proposalSent, approved, reserved };
  }, [quotes]);

  const filteredQuotes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        quote.quote_code.toLowerCase().includes(normalizedSearch) ||
        (quote.customer_name ?? "").toLowerCase().includes(normalizedSearch) ||
        (quote.customer_phone ?? "").toLowerCase().includes(normalizedSearch) ||
        (quote.customer_email ?? "").toLowerCase().includes(normalizedSearch) ||
        quote.service_label.toLowerCase().includes(normalizedSearch) ||
        (quote.service_location ?? "").toLowerCase().includes(normalizedSearch);
      return matchesStatus && matchesSearch;
    });
  }, [quotes, search, statusFilter]);

  function selectQuote(quote: QuoteRequest) {
    setSelectedQuote(quote);
    setEditValues(createEditValues(quote));
    setMeetingValues(createMeetingValues(quote));
    setScheduleValues(createScheduleValues(quote));
    setReservationValues(createReservationValues(quote));
    setEditMode(false);
    setMessage("");
  }

  function updateLocalQuote(updatedQuote: QuoteRequest) {
    setQuotes((currentQuotes) => currentQuotes.map((quote) => (quote.id === updatedQuote.id ? updatedQuote : quote)));
    setSelectedQuote(updatedQuote);
    setEditValues(createEditValues(updatedQuote));
    setMeetingValues(createMeetingValues(updatedQuote));
    setScheduleValues(createScheduleValues(updatedQuote));
    setReservationValues(createReservationValues(updatedQuote));
  }

  async function updateStatus(quote: QuoteRequest, newStatus: QuoteStatus) {
    setSavingId(quote.id);
    setMessage("");
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = { status: newStatus, updated_at: now };
    if (newStatus === "approved") payload.approved_at = quote.approved_at ?? now;
    if (newStatus === "proposal_sent") payload.final_quote_sent_at = quote.final_quote_sent_at ?? now;
    if (newStatus === "reserved") {
      payload.reservation_status = "reserved";
      payload.reservation_confirmed_at = quote.reservation_confirmed_at ?? now;
    }
    if (newStatus === "scheduled") payload.scheduled_at = quote.scheduled_at ?? now;

    const { error } = await supabase.from("quote_requests").update(payload).eq("id", quote.id);
    if (error) {
      setMessage(`No se pudo actualizar el estado: ${error.message}`);
      setSavingId("");
      return;
    }
    updateLocalQuote({ ...quote, ...payload } as QuoteRequest);
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
    const durationTotalMinutes = getDurationTotalMinutes(editValues.duration_hours_value, editValues.duration_minutes_value);
    const durationHours = getDurationHours(editValues.duration_hours_value, editValues.duration_minutes_value);
    const finalWhatsappMessage = buildWhatsappMessageForValues(selectedQuote.quote_code, editValues, meetingValues ?? undefined);

    const payload: Record<string, unknown> = {
      customer_name: editValues.customer_name || null,
      customer_phone: editValues.customer_phone || null,
      customer_email: editValues.customer_email || null,
      customer_document: editValues.customer_document || null,
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
      guest_count: Number(editValues.guest_count) || null,
      digital_delivery: editValues.digital_delivery,
      printed_delivery: editValues.printed_delivery,
      special_deliverable: editValues.special_deliverable,
      details: editValues.details || null,
      admin_notes: editValues.admin_notes || null,
      internal_pricing_notes: editValues.internal_pricing_notes || estimate.pricingNotes,
      selected_package: editValues.selected_package || null,
      final_price_cop: estimate.finalPrice || null,
      base_min_cop: estimate.baseMin,
      base_max_cop: estimate.baseMax,
      travel_surcharge_percent: estimate.surchargePercent,
      travel_surcharge_min_cop: estimate.surchargeMin,
      travel_surcharge_max_cop: estimate.surchargeMax,
      estimated_min_cop: estimate.autoTotalMin,
      estimated_max_cop: estimate.autoTotalMax,
      requires_travel_review: selectedZone.requiresTravelReview,
      requires_manual_review: true,
      whatsapp_message: finalWhatsappMessage,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("quote_requests").update(payload).eq("id", selectedQuote.id);
    if (error) {
      setMessage(`No se pudieron guardar los cambios: ${error.message}`);
      setSavingId("");
      return;
    }

    updateLocalQuote({ ...selectedQuote, ...payload } as QuoteRequest);
    setEditMode(false);
    setMessage("Solicitud actualizada correctamente.");
    setSavingId("");
  }

  async function saveMeeting({ markDone = false }: { markDone?: boolean } = {}) {
    if (!selectedQuote || !meetingValues) return;
    setSavingId(selectedQuote.id);
    setMessage("");

    const now = new Date().toISOString();
    const finalMeetingStatus = markDone ? "realizada" : meetingValues.meeting_status;
    const payload: Record<string, unknown> = {
      meeting_requested: meetingValues.meeting_requested,
      meeting_type: meetingValues.meeting_type,
      meeting_status: finalMeetingStatus,
      meeting_date: meetingValues.meeting_date || null,
      meeting_start_time: meetingValues.meeting_start_time || null,
      meeting_end_time: meetingValues.meeting_end_time || null,
      meeting_location: meetingValues.meeting_location || null,
      meeting_notes: meetingValues.meeting_notes || null,
      meeting_completed_at: markDone ? selectedQuote.meeting_completed_at ?? now : selectedQuote.meeting_completed_at,
      status: selectedQuote.status === "new" || selectedQuote.status === "new_travel_review" ? "reviewing" : selectedQuote.status,
      updated_at: now,
    };

    const { error } = await supabase.from("quote_requests").update(payload).eq("id", selectedQuote.id);
    if (error) {
      setMessage(`No se pudo guardar la reunión: ${error.message}`);
      setSavingId("");
      return;
    }

    updateLocalQuote({ ...selectedQuote, ...payload } as QuoteRequest);
    setMessage(markDone ? "Reunión marcada como realizada." : "Reunión guardada correctamente.");
    setSavingId("");
  }

  async function saveSchedule({ approve = false }: { approve?: boolean } = {}) {
    if (!selectedQuote || !scheduleValues) return;
    if (approve && (!scheduleValues.confirmed_event_date || !scheduleValues.confirmed_start_time || !scheduleValues.confirmed_end_time)) {
      setMessage("Para aprobar con agenda debes completar fecha, hora de inicio y hora de finalización.");
      return;
    }

    setSavingId(selectedQuote.id);
    setMessage("");
    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      confirmed_event_date: scheduleValues.confirmed_event_date || null,
      confirmed_start_time: scheduleValues.confirmed_start_time || null,
      confirmed_end_time: scheduleValues.confirmed_end_time || null,
      confirmed_timezone: scheduleValues.confirmed_timezone || "America/Bogota",
      confirmed_location: scheduleValues.confirmed_location || null,
      schedule_notes: scheduleValues.schedule_notes || null,
      updated_at: now,
    };
    if (approve) {
      payload.status = "approved";
      payload.approved_at = selectedQuote.approved_at ?? now;
    }

    const { error } = await supabase.from("quote_requests").update(payload).eq("id", selectedQuote.id);
    if (error) {
      setMessage(`No se pudo guardar la agenda: ${error.message}`);
      setSavingId("");
      return;
    }

    updateLocalQuote({ ...selectedQuote, ...payload } as QuoteRequest);
    setMessage(approve ? "Agenda guardada y cotización aprobada correctamente." : "Agenda guardada correctamente.");
    setSavingId("");
  }

  async function copyWhatsappMessage(quote: QuoteRequest) {
    if (!quote.whatsapp_message) {
      setMessage("Esta solicitud no tiene mensaje guardado.");
      return;
    }
    await navigator.clipboard.writeText(quote.whatsapp_message);
    setMessage("Mensaje interno copiado.");
  }


  async function saveReservation({ confirm = false }: { confirm?: boolean } = {}) {
    if (!selectedQuote || !reservationValues) return;

    setSavingId(selectedQuote.id);
    setMessage("");

    const now = new Date().toISOString();
    const depositRequired = parseCOPInput(reservationValues.deposit_required_cop);
    const depositPaid = parseCOPInput(reservationValues.deposit_paid_cop);
    const reservationStatus = confirm
      ? reservationValues.reservation_status === "no_deposit_required"
        ? "no_deposit_required"
        : "reserved"
      : reservationValues.reservation_status;
    const paymentStatus = reservationStatus === "no_deposit_required"
      ? "not_required"
      : confirm && depositPaid > 0
      ? "paid"
      : reservationValues.payment_status;
    const paidAt = reservationValues.paid_at
      ? new Date(reservationValues.paid_at).toISOString()
      : paymentStatus === "paid" && depositPaid > 0
      ? selectedQuote.paid_at ?? now
      : null;

    const payload: Record<string, unknown> = {
      reservation_status: reservationStatus,
      deposit_required_cop: depositRequired || null,
      deposit_paid_cop: depositPaid || null,
      payment_method: reservationValues.payment_method || null,
      payment_provider: reservationValues.payment_provider || "manual",
      payment_reference: reservationValues.payment_reference || null,
      payment_status: paymentStatus,
      paid_at: paidAt,
      reservation_notes: reservationValues.reservation_notes || null,
      updated_at: now,
    };

    if (confirm) {
      payload.status = "reserved";
      payload.reservation_confirmed_at = selectedQuote.reservation_confirmed_at ?? now;
    } else {
      payload.reservation_confirmed_at = selectedQuote.reservation_confirmed_at;
    }

    const { error } = await supabase.from("quote_requests").update(payload).eq("id", selectedQuote.id);

    if (error) {
      setMessage(`No se pudo guardar la reserva: ${error.message}`);
      setSavingId("");
      return;
    }

    updateLocalQuote({ ...selectedQuote, ...payload } as QuoteRequest);
    setMessage(confirm ? "Reserva confirmada correctamente." : "Reserva guardada correctamente.");
    setSavingId("");
  }

  function openClientMeetingWhatsapp(quote: QuoteRequest, currentMeetingValues?: MeetingValues) {
    const phone = normalizePhoneForWhatsapp(quote.customer_phone);

    if (!phone) {
      setMessage("El cliente no tiene un WhatsApp válido.");
      return;
    }

    const meetingType = currentMeetingValues?.meeting_type ?? toMeetingType(quote.meeting_type);
    const meetingDate = currentMeetingValues?.meeting_date ?? quote.meeting_date;
    const meetingStartTime = currentMeetingValues?.meeting_start_time ?? quote.meeting_start_time;
    const meetingLocation = currentMeetingValues?.meeting_location ?? quote.meeting_location;

    if (meetingType === "por_definir") {
      setMessage("Selecciona el tipo de reunión antes de enviar la invitación.");
      return;
    }

    if ((meetingType === "virtual" || meetingType === "presencial") && (!meetingDate || !meetingStartTime)) {
      setMessage("Completa fecha y hora de inicio antes de enviar la invitación de reunión.");
      return;
    }

    if (meetingType === "virtual" && !meetingLocation?.trim()) {
      setMessage("Agrega el enlace de la reunión virtual antes de enviar la invitación.");
      return;
    }

    if (meetingType === "presencial" && !meetingLocation?.trim()) {
      setMessage("Agrega el lugar de la reunión presencial antes de enviar la invitación.");
      return;
    }

    const reply = buildClientMeetingMessage(quote, currentMeetingValues);
    const link = `https://wa.me/${phone}?text=${encodeURIComponent(reply)}`;

    window.open(link, "_blank", "noopener,noreferrer");
  }

  async function openClientFinalQuoteWhatsapp(quote: QuoteRequest) {
    const phone = normalizePhoneForWhatsapp(quote.customer_phone);

    if (!phone) {
      setMessage("El cliente no tiene un WhatsApp válido.");
      return;
    }

    if (!quote.final_price_cop) {
      setMessage("Define y guarda el valor final antes de enviar el mensaje final.");
      return;
    }

    const link = `https://wa.me/${phone}?text=${encodeURIComponent(
      buildClientFinalQuoteMessage(quote)
    )}`;

    window.open(link, "_blank", "noopener,noreferrer");

    const now = new Date().toISOString();
    const statusAfterSend = ["reserved", "completed", "cancelled"].includes(String(quote.status))
      ? quote.status
      : "proposal_sent";
    const payload: Record<string, unknown> = {
      status: statusAfterSend,
      final_quote_sent_at: quote.final_quote_sent_at ?? now,
      updated_at: now,
    };

    const { error } = await supabase.from("quote_requests").update(payload).eq("id", quote.id);

    if (error) {
      setMessage(`WhatsApp abierto, pero no se pudo marcar la propuesta como enviada: ${error.message}`);
      return;
    }

    updateLocalQuote({ ...quote, ...payload } as QuoteRequest);
    setMessage(
      "WhatsApp abierto. Recuerda adjuntar manualmente el PDF de la propuesta antes de enviarlo al cliente."
    );
  }

  function openClientQuickWhatsapp(
    quote: QuoteRequest,
    type: QuoteQuickMessageType
  ) {
    const phone = normalizePhoneForWhatsapp(quote.customer_phone);

    if (!phone) {
      setMessage("El cliente no tiene un WhatsApp válido.");
      return;
    }

    const link = `https://wa.me/${phone}?text=${encodeURIComponent(
      buildQuoteQuickWhatsappMessage(quote, type)
    )}`;

    window.open(link, "_blank", "noopener,noreferrer");
    setMessage("WhatsApp abierto con el mensaje rápido. Revisa antes de enviarlo.");
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Nuevas" value={stats.news} />
        <StatCard label="Propuestas" value={stats.proposalSent} />
        <StatCard label="Aprobadas" value={stats.approved} />
        <StatCard label="Reservadas" value={stats.reserved} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente, código, servicio..." className="admin-input" />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="admin-input admin-select">
              <option value="all">Todos los estados</option>
              {statusOptions.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
            </select>
          </div>

          {message && <p className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-3 text-xs leading-5 text-white/55">{message}</p>}

          <div className="mt-5 grid gap-3">
            {filteredQuotes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 text-sm text-white/45">No hay solicitudes con estos filtros.</div>
            ) : (
              filteredQuotes.map((quote) => {
                const active = selectedQuote?.id === quote.id;
                return (
                  <button
                    key={quote.id}
                    type="button"
                    onClick={() => selectQuote(quote)}
                    className={`rounded-2xl border p-4 text-left transition ${active ? "border-white bg-white text-black" : "border-white/10 bg-black/30 text-white hover:border-white/25"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] opacity-55">{quote.quote_code}</p>
                        <h3 className="mt-2 text-base font-semibold">{quote.customer_name || "Cliente sin nombre"}</h3>
                      </div>
                      <StatusBadge status={quote.status} />
                    </div>
                    <p className="mt-3 text-sm opacity-65">{quote.service_label}</p>
                    <p className="mt-2 text-xs opacity-55">Reunión: {meetingStatusLabels[quote.meeting_status ?? "pendiente_programar"] ?? "Pendiente"}</p>
                    {quote.final_price_cop ? <p className="mt-2 text-sm font-medium">Final: {formatCOP(quote.final_price_cop)}</p> : <p className="mt-2 text-sm opacity-50">Sin valor final</p>}
                    <p className="mt-2 text-xs opacity-55">Reserva: {reservationStatusLabels[quote.reservation_status ?? "pending_deposit"] ?? "Pendiente de abono"}</p>
                    {quote.requires_travel_review && <p className={`mt-3 rounded-xl border px-3 py-2 text-xs ${active ? "border-yellow-500/30 bg-yellow-100 text-yellow-900" : "border-yellow-400/20 bg-yellow-400/10 text-yellow-100/80"}`}>Requiere revisión por desplazamiento</p>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          {selectedQuote && editValues && meetingValues && scheduleValues && reservationValues ? (
            <QuoteDetail
              quote={selectedQuote}
              editMode={editMode}
              editValues={editValues}
              meetingValues={meetingValues}
              scheduleValues={scheduleValues}
              reservationValues={reservationValues}
              saving={savingId === selectedQuote.id}
              onEditValuesChange={setEditValues}
              onMeetingValuesChange={setMeetingValues}
              onScheduleValuesChange={setScheduleValues}
              onReservationValuesChange={setReservationValues}
              onToggleEdit={() => setEditMode((current) => !current)}
              onCancelEdit={() => { setEditValues(createEditValues(selectedQuote)); setEditMode(false); }}
              onSaveChanges={saveQuoteChanges}
              onSaveMeeting={saveMeeting}
              onSaveSchedule={saveSchedule}
              onSaveReservation={saveReservation}
              onUpdateStatus={updateStatus}
              onCopyWhatsappMessage={copyWhatsappMessage}
              onOpenClientMeetingWhatsapp={openClientMeetingWhatsapp}
              onOpenClientFinalQuoteWhatsapp={openClientFinalQuoteWhatsapp}
              onOpenClientQuickWhatsapp={openClientQuickWhatsapp}
            />
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/45">Selecciona una solicitud para ver el detalle.</div>
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
        .admin-input:focus { border-color: rgba(255, 255, 255, 0.38); }
        .admin-input::placeholder { color: rgba(255, 255, 255, 0.3); }
        .admin-input {
          color-scheme: dark;
        }

        .admin-input option,
        .admin-select option {
          color: black;
          background: white;
        }

        .admin-input[type="date"],
        .admin-input[type="time"] {
          color-scheme: dark;
        }

        .admin-input[type="date"]::-webkit-calendar-picker-indicator,
        .admin-input[type="time"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: invert(1) brightness(2) contrast(1.1);
          opacity: 0.78;
        }

        .admin-input[type="date"]::-webkit-calendar-picker-indicator:hover,
        .admin-input[type="time"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

function QuoteDetail({
  quote,
  editMode,
  editValues,
  meetingValues,
  scheduleValues,
  reservationValues,
  saving,
  onEditValuesChange,
  onMeetingValuesChange,
  onScheduleValuesChange,
  onReservationValuesChange,
  onToggleEdit,
  onCancelEdit,
  onSaveChanges,
  onSaveMeeting,
  onSaveSchedule,
  onSaveReservation,
  onUpdateStatus,
  onCopyWhatsappMessage,
  onOpenClientMeetingWhatsapp,
  onOpenClientFinalQuoteWhatsapp,
  onOpenClientQuickWhatsapp,
}: {
  quote: QuoteRequest;
  editMode: boolean;
  editValues: EditValues;
  meetingValues: MeetingValues;
  scheduleValues: ScheduleValues;
  reservationValues: ReservationValues;
  saving: boolean;
  onEditValuesChange: (values: EditValues) => void;
  onMeetingValuesChange: (values: MeetingValues) => void;
  onScheduleValuesChange: (values: ScheduleValues) => void;
  onReservationValuesChange: (values: ReservationValues) => void;
  onToggleEdit: () => void;
  onCancelEdit: () => void;
  onSaveChanges: (event: FormEvent<HTMLFormElement>) => void;
  onSaveMeeting: (options?: { markDone?: boolean }) => void;
  onSaveSchedule: (options?: { approve?: boolean }) => void;
  onSaveReservation: (options?: { confirm?: boolean }) => void;
  onUpdateStatus: (quote: QuoteRequest, status: QuoteStatus) => void;
  onCopyWhatsappMessage: (quote: QuoteRequest) => void;
  onOpenClientMeetingWhatsapp: (quote: QuoteRequest, meetingValues?: MeetingValues) => void;
  onOpenClientFinalQuoteWhatsapp: (quote: QuoteRequest) => void;
  onOpenClientQuickWhatsapp: (quote: QuoteRequest, type: QuoteQuickMessageType) => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-white/35">{quote.quote_code}</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{quote.customer_name || "Cliente sin nombre"}</h2>
          <p className="mt-2 text-sm text-white/45">Creada el {formatDateTime(quote.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={quote.status} />
          <button type="button" onClick={onToggleEdit} className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/70 transition hover:border-white/35 hover:text-white">
            {editMode ? "Cerrar edición" : "Editar solicitud"}
          </button>
        </div>
      </div>

      {editMode ? <QuoteEditForm values={editValues} saving={saving} onChange={onEditValuesChange} onCancel={onCancelEdit} onSubmit={onSaveChanges} /> : <QuoteReadView quote={quote} />}

      <MeetingPanel
        values={meetingValues}
        quote={quote}
        saving={saving}
        onChange={onMeetingValuesChange}
        onSave={() => onSaveMeeting()}
        onSendInvitation={() => onOpenClientMeetingWhatsapp(quote, meetingValues)}
        onMarkDone={() => onSaveMeeting({ markDone: true })}
      />

      <SchedulePanel values={scheduleValues} quote={quote} saving={saving} onChange={onScheduleValuesChange} onSave={() => onSaveSchedule()} onSaveAndApprove={() => onSaveSchedule({ approve: true })} />

      <ReservationPanel
        values={reservationValues}
        quote={quote}
        saving={saving}
        onChange={onReservationValuesChange}
        onSave={() => onSaveReservation()}
        onConfirm={() => onSaveReservation({ confirm: true })}
        onComplete={() => onUpdateStatus(quote, "completed")}
        onCancel={() => onUpdateStatus(quote, "cancelled")}
      />

      <QuoteWhatsappQuickActions
        quote={quote}
        onOpenMessage={(type) => onOpenClientQuickWhatsapp(quote, type)}
      />

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-white/35">Estado de la solicitud</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {statusOptions.map((status) => {
            const active = quote.status === status.value;
            return (
              <button key={status.value} type="button" disabled={saving} onClick={() => onUpdateStatus(quote, status.value)} className={`rounded-full border px-4 py-2 text-xs transition disabled:cursor-not-allowed disabled:opacity-60 ${active ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/30 hover:text-white"}`}>
                {status.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/35">
            Acciones finales
          </p>

          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
            Envío y cierre de la cotización
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            Primero genera y guarda el PDF de la propuesta. Luego abre WhatsApp con
            el mensaje final y adjunta manualmente el archivo antes de enviarlo
            al cliente.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onCopyWhatsappMessage(quote)}
            className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/35 hover:text-white"
          >
            Copiar mensaje interno
          </button>

          <Link
            href={`/admin/cotizaciones/${quote.id}/propuesta`}
            className="rounded-full border border-white/15 bg-white/[0.03] px-5 py-3 text-center text-sm text-white/80 transition hover:border-white/35 hover:bg-white hover:text-black"
          >
            Ver / generar propuesta PDF
          </Link>

          <button
            type="button"
            onClick={() => onOpenClientFinalQuoteWhatsapp(quote)}
            className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.02] sm:col-span-2"
          >
            Enviar mensaje final y adjuntar PDF
          </button>
        </div>

        <button
          type="button"
          disabled
          className="mt-3 w-full cursor-not-allowed rounded-full border border-white/10 px-5 py-3 text-sm text-white/25"
          title="Se activará cuando integremos Google Calendar"
        >
          Crear evento en Google Calendar
        </button>

        <p className="mt-3 text-xs leading-5 text-white/35">
          La propuesta final debe enviarse únicamente cuando el valor, los
          entregables, las condiciones y el PDF estén revisados por el equipo.
        </p>
      </div>
    </div>
  );
}


function QuoteWhatsappQuickActions({
  quote,
  onOpenMessage,
}: {
  quote: QuoteRequest;
  onOpenMessage: (type: QuoteQuickMessageType) => void;
}) {
  const actions: {
    type: QuoteQuickMessageType;
    label: string;
    description: string;
  }[] = [
    {
      type: "approval_deposit",
      label: "Solicitar aprobación / abono",
      description: "Pide confirmación de propuesta y reserva.",
    },
    {
      type: "payment_proof",
      label: "Solicitar comprobante",
      description: "Pide soporte del abono acordado.",
    },
    {
      type: "reservation_confirmed",
      label: "Reserva confirmada",
      description: "Confirma fecha, hora, lugar y abono.",
    },
    {
      type: "service_reminder",
      label: "Recordatorio del servicio",
      description: "Envía detalles antes del evento o sesión.",
    },
    {
      type: "reservation_receipt",
      label: "Enviar constancia",
      description: "Mensaje para adjuntar la constancia PDF.",
    },
    {
      type: "service_completed",
      label: "Servicio finalizado",
      description: "Agradece y cierra el servicio.",
    },
  ];

  const hasPhone = !!normalizePhoneForWhatsapp(quote.customer_phone);

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-white/35">
        Mensajes rápidos por WhatsApp
      </p>

      <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">
        Seguimiento semiautomático del cliente
      </h3>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
        Abre WhatsApp con textos listos según el momento de la cotización. El
        equipo debe revisar el mensaje antes de enviarlo.
      </p>

      {!hasPhone && (
        <p className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-xs leading-5 text-yellow-100/80">
          Esta solicitud no tiene un WhatsApp válido.
        </p>
      )}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action.type}
            type="button"
            disabled={!hasPhone}
            onClick={() => onOpenMessage(action.type)}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-white/30 hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/10 disabled:hover:bg-white/[0.03] disabled:hover:text-white"
          >
            <span className="block text-sm font-medium">{action.label}</span>
            <span className="mt-1 block text-xs opacity-55">
              {action.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}


function QuoteReadView({ quote }: { quote: QuoteRequest }) {
  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Info label="WhatsApp" value={quote.customer_phone || "Sin número"} />
        <Info label="Correo" value={quote.customer_email || "Sin correo"} />
        <Info label="Documento" value={quote.customer_document || "Sin documento"} />
        <Info label="Servicio" value={quote.service_label} />
        <Info label="Fecha aproximada" value={formatDateOnly(quote.event_date)} />
        <Info label="Duración" value={getDurationLabel(quote)} />
        <Info label="Zona" value={quote.service_zone_label} />
        <Info label="Lugar exacto" value={quote.service_location || "Por definir"} />
        <Info label="Cantidad" value={quote.quantity ? String(quote.quantity) : "Por definir"} />
        <Info label="Invitados" value={quote.guest_count ? String(quote.guest_count) : "No indicado"} />
        <Info label="Referencia interna" value={getInternalReferenceLabel(quote)} />
        <Info label="Valor final" value={quote.final_price_cop ? formatCOP(quote.final_price_cop) : "Sin definir"} />
        <Info label="Reserva" value={reservationStatusLabels[quote.reservation_status ?? "pending_deposit"] ?? "Pendiente de abono"} />
        <Info label="Abono" value={`${formatCOP(quote.deposit_paid_cop)} / ${formatCOP(quote.deposit_required_cop)}`} />
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-white/35">Entregables</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MiniFlag label="Digital" active={!!quote.digital_delivery} />
          <MiniFlag label="Impresa" active={!!quote.printed_delivery} />
          <MiniFlag label="Especial" active={!!quote.special_deliverable} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-white/35">Desplazamiento y reglas internas</p>
        <p className="mt-3 text-sm leading-6 text-white/60">Recargo interno: {quote.travel_surcharge_percent}% ({formatCOP(quote.travel_surcharge_min_cop)} - {formatCOP(quote.travel_surcharge_max_cop)})</p>
        {quote.requires_travel_review && <p className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100/80">Esta solicitud requiere revisión manual por desplazamiento especial.</p>}
      </div>

      <TextBlock title="Detalles adicionales" text={quote.details} />
      <TextBlock title="Notas internas" text={quote.admin_notes} />
      <TextBlock title="Notas internas de precio" text={quote.internal_pricing_notes} />
    </>
  );
}

function MeetingPanel({
  values,
  quote,
  saving,
  onChange,
  onSave,
  onSendInvitation,
  onMarkDone,
}: {
  values: MeetingValues;
  quote: QuoteRequest;
  saving: boolean;
  onChange: (values: MeetingValues) => void;
  onSave: () => void;
  onSendInvitation: () => void;
  onMarkDone: () => void;
}) {
  const hasMeeting = values.meeting_type === "whatsapp" || (!!values.meeting_date && !!values.meeting_start_time);
  const meetingPlaceLabel = values.meeting_type === "virtual" ? "Enlace de reunión" : values.meeting_type === "presencial" ? "Lugar de reunión" : "Canal / notas";
  const meetingPlacePlaceholder = values.meeting_type === "virtual" ? "Enlace de Meet, Zoom o videollamada" : values.meeting_type === "presencial" ? "Dirección, sede o punto de encuentro" : "Opcional: se continuará por este chat de WhatsApp";
  function updateField<Key extends keyof MeetingValues>(key: Key, value: MeetingValues[Key]) { onChange({ ...values, [key]: value }); }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/35">Reunión de definición</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Paso previo antes de enviar la cotización final</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">Usa esta sección para programar una reunión virtual, presencial o continuar por WhatsApp. Después de la reunión se ajusta el valor final y, si aplica, se genera el PDF.</p>
        </div>
        <div className={`rounded-2xl border px-4 py-3 text-sm ${hasMeeting ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100/80" : "border-white/10 bg-white/[0.03] text-white/50"}`}>{meetingStatusLabels[quote.meeting_status ?? "pendiente_programar"] ?? "Pendiente"}</div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <EditField label="Tipo de reunión">
          <select value={values.meeting_type} onChange={(event) => updateField("meeting_type", event.target.value as MeetingType)} className="admin-input admin-select">
            <option value="por_definir">Por definir</option>
            <option value="virtual">Virtual</option>
            <option value="presencial">Presencial</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </EditField>
        <EditField label="Estado">
          <select value={values.meeting_status} onChange={(event) => updateField("meeting_status", event.target.value as MeetingStatus)} className="admin-input admin-select">
            <option value="pendiente_programar">Pendiente por programar</option>
            <option value="programada">Programada</option>
            <option value="realizada">Realizada</option>
            <option value="no_requerida">No requerida</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </EditField>
        <EditField label="Fecha">
          <input type="date" value={values.meeting_date} onChange={(event) => updateField("meeting_date", event.target.value)} className="admin-input" />
        </EditField>
        <EditField label="Hora de inicio">
          <input type="time" value={values.meeting_start_time} onChange={(event) => updateField("meeting_start_time", event.target.value)} className="admin-input" />
        </EditField>
        <EditField label="Hora de cierre">
          <input type="time" value={values.meeting_end_time} onChange={(event) => updateField("meeting_end_time", event.target.value)} className="admin-input" />
        </EditField>
        <EditField label={meetingPlaceLabel} full>
          <input value={values.meeting_location} onChange={(event) => updateField("meeting_location", event.target.value)} placeholder={meetingPlacePlaceholder} className="admin-input" />
        </EditField>
        <EditField label="Notas de reunión" full>
          <textarea value={values.meeting_notes} onChange={(event) => updateField("meeting_notes", event.target.value)} rows={3} placeholder="Ej: revisar paquete, definir photobook, confirmar invitados, pedir abono..." className="admin-input resize-none" />
        </EditField>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-5 text-white/45">
        Primero guarda los datos de la reunión. Luego envía la invitación por
        WhatsApp desde esta misma sección. Cuando la reunión termine, márcala
        como realizada para continuar con el ajuste de la cotización final.
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar reunión"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={onSendInvitation}
          className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Enviar invitación
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={onMarkDone}
          className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-5 py-3 text-sm text-emerald-100/80 transition hover:border-emerald-300/45 hover:text-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Marcar realizada"}
        </button>
      </div>
    </div>
  );
}

function SchedulePanel({ values, quote, saving, onChange, onSave, onSaveAndApprove }: { values: ScheduleValues; quote: QuoteRequest; saving: boolean; onChange: (values: ScheduleValues) => void; onSave: () => void; onSaveAndApprove: () => void }) {
  const hasConfirmedSchedule = !!quote.confirmed_event_date && !!quote.confirmed_start_time && !!quote.confirmed_end_time;
  function updateField<Key extends keyof ScheduleValues>(key: Key, value: ScheduleValues[Key]) { onChange({ ...values, [key]: value }); }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/35">Agenda final del servicio</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Fecha y hora definitiva del evento</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">Usa esta sección solo cuando el cliente ya haya aprobado la cotización final.</p>
        </div>
        {hasConfirmedSchedule && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100/80">Agenda lista</div>}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <EditField label="Fecha del evento"><input type="date" value={values.confirmed_event_date} onChange={(event) => updateField("confirmed_event_date", event.target.value)} className="admin-input" /></EditField>
        <EditField label="Hora de inicio"><input type="time" value={values.confirmed_start_time} onChange={(event) => updateField("confirmed_start_time", event.target.value)} className="admin-input" /></EditField>
        <EditField label="Hora de finalización"><input type="time" value={values.confirmed_end_time} onChange={(event) => updateField("confirmed_end_time", event.target.value)} className="admin-input" /></EditField>
        <EditField label="Zona horaria"><input value={values.confirmed_timezone} onChange={(event) => updateField("confirmed_timezone", event.target.value)} className="admin-input" /></EditField>
        <EditField label="Lugar confirmado" full><input value={values.confirmed_location} onChange={(event) => updateField("confirmed_location", event.target.value)} placeholder="Dirección o lugar final acordado con el cliente" className="admin-input" /></EditField>
        <EditField label="Notas de agenda" full><textarea value={values.schedule_notes} onChange={(event) => updateField("schedule_notes", event.target.value)} rows={3} placeholder="Ej: llevar luces, confirmar abono, llegar 30 minutos antes..." className="admin-input resize-none" /></EditField>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={saving} onClick={onSave} className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Guardando..." : "Guardar agenda"}</button>
        <button type="button" disabled={saving} onClick={onSaveAndApprove} className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Guardando..." : "Guardar agenda y aprobar"}</button>
      </div>
    </div>
  );
}


function ReservationPanel({ values, quote, saving, onChange, onSave, onConfirm, onComplete, onCancel }: { values: ReservationValues; quote: QuoteRequest; saving: boolean; onChange: (values: ReservationValues) => void; onSave: () => void; onConfirm: () => void; onComplete: () => void; onCancel: () => void }) {
  function updateField<Key extends keyof ReservationValues>(key: Key, value: ReservationValues[Key]) {
    onChange({ ...values, [key]: value });
  }

  const remainingDeposit = Math.max(parseCOPInput(values.deposit_required_cop) - parseCOPInput(values.deposit_paid_cop), 0);

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-white/35">Reserva y abono</p>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Pago de reserva del servicio</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
            Registra el abono manual por Nequi, transferencia, efectivo u otro método. La estructura queda lista para conectar Wompi más adelante.
          </p>
        </div>

        <ReservationBadge status={values.reservation_status} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <EditField label="Estado de reserva">
          <select value={values.reservation_status} onChange={(event) => updateField("reservation_status", event.target.value as ReservationStatus)} className="admin-input admin-select">
            <option value="pending_deposit">Pendiente de abono</option>
            <option value="reserved">Reservada</option>
            <option value="no_deposit_required">Sin abono requerido</option>
          </select>
        </EditField>

        <EditField label="Proveedor de pago">
          <select value={values.payment_provider} onChange={(event) => updateField("payment_provider", event.target.value as PaymentProvider)} className="admin-input admin-select">
            <option value="manual">Manual</option>
            <option value="wompi">Wompi futuro</option>
          </select>
        </EditField>

        <EditField label="Abono requerido">
          <input type="number" min="0" step="1000" value={values.deposit_required_cop} onChange={(event) => updateField("deposit_required_cop", event.target.value)} placeholder="Ej: 300000" className="admin-input" />
        </EditField>

        <EditField label="Valor abonado">
          <input type="number" min="0" step="1000" value={values.deposit_paid_cop} onChange={(event) => updateField("deposit_paid_cop", event.target.value)} placeholder="Ej: 300000" className="admin-input" />
        </EditField>

        <EditField label="Método de pago">
          <select value={values.payment_method} onChange={(event) => updateField("payment_method", event.target.value as PaymentMethod)} className="admin-input admin-select">
            <option value="">Por definir</option>
            <option value="nequi">Nequi</option>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
            <option value="wompi">Wompi</option>
            <option value="otro">Otro</option>
          </select>
        </EditField>

        <EditField label="Estado del pago">
          <select value={values.payment_status} onChange={(event) => updateField("payment_status", event.target.value as PaymentStatus)} className="admin-input admin-select">
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
            <option value="failed">Fallido</option>
            <option value="cancelled">Cancelado</option>
            <option value="refunded">Reembolsado</option>
            <option value="not_required">No requerido</option>
          </select>
        </EditField>

        <EditField label="Fecha de pago">
          <input type="datetime-local" value={values.paid_at} onChange={(event) => updateField("paid_at", event.target.value)} className="admin-input" />
        </EditField>

        <EditField label="Referencia / comprobante">
          <input value={values.payment_reference} onChange={(event) => updateField("payment_reference", event.target.value)} placeholder="Número de comprobante, transacción o nota" className="admin-input" />
        </EditField>
      </div>

      <EditField label="Notas de reserva" full className="mt-5 block">
        <textarea value={values.reservation_notes} onChange={(event) => updateField("reservation_notes", event.target.value)} rows={3} placeholder="Ej: abono recibido, confirmar comprobante, pendiente saldo final..." className="admin-input resize-none" />
      </EditField>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Info label="Valor final" value={quote.final_price_cop ? formatCOP(quote.final_price_cop) : "Sin valor final"} />
        <Info label="Abono pendiente" value={formatCOP(remainingDeposit)} />
        <Info label="Pago" value={`${paymentProviderLabels[values.payment_provider]} · ${paymentStatusLabels[values.payment_status]}`} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={saving} onClick={onSave} className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Guardando..." : "Guardar reserva"}
        </button>

        <button type="button" disabled={saving} onClick={onConfirm} className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "Guardando..." : "Confirmar reserva"}
        </button>

        <button type="button" disabled={saving} onClick={onComplete} className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-5 py-3 text-sm text-emerald-100/80 transition hover:border-emerald-300/45 disabled:cursor-not-allowed disabled:opacity-60">
          Finalizar servicio
        </button>

        <button type="button" disabled={saving} onClick={onCancel} className="rounded-full border border-red-400/25 bg-red-400/10 px-5 py-3 text-sm text-red-100/80 transition hover:border-red-300/45 disabled:cursor-not-allowed disabled:opacity-60">
          Cancelar solicitud
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/admin/cotizaciones/${quote.id}/reserva`}
          target="_blank"
          className="rounded-full border border-white/15 bg-white/[0.03] px-5 py-3 text-center text-sm text-white/80 transition hover:border-white/35 hover:bg-white hover:text-black sm:col-span-2"
        >
          Ver / generar constancia de reserva
        </Link>
      </div>

      <p className="mt-3 text-xs leading-5 text-white/35">
        Cuando se integre Wompi, este mismo bloque podrá guardar la referencia de transacción y actualizar el estado de pago automáticamente.
      </p>
    </div>
  );
}

function QuoteEditForm({ values, saving, onChange, onCancel, onSubmit }: { values: EditValues; saving: boolean; onChange: (values: EditValues) => void; onCancel: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const estimate = getEstimateFromValues(values);
  const selectedZone = serviceZones[values.service_zone];
  function updateField<Key extends keyof EditValues>(key: Key, value: EditValues[Key]) { onChange({ ...values, [key]: value }); }

  return (
    <form onSubmit={onSubmit} className="mt-6">
      <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-white/35">Editar información</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <EditField label="Nombre"><input value={values.customer_name} onChange={(event) => updateField("customer_name", event.target.value)} className="admin-input" /></EditField>
          <EditField label="WhatsApp"><input value={values.customer_phone} onChange={(event) => updateField("customer_phone", event.target.value)} className="admin-input" /></EditField>
          <EditField label="Correo"><input type="email" value={values.customer_email} onChange={(event) => updateField("customer_email", event.target.value)} className="admin-input" /></EditField>
          <EditField label="Documento"><input value={values.customer_document} onChange={(event) => updateField("customer_document", event.target.value)} className="admin-input" /></EditField>
          <EditField label="Servicio" full><select value={values.service_type} onChange={(event) => updateField("service_type", event.target.value as ServiceKey)} className="admin-input admin-select">{serviceOptions.map((service) => <option key={service.value} value={service.value}>{service.label}</option>)}</select></EditField>
          <EditField label="Fecha aproximada"><input type="date" value={values.event_date} onChange={(event) => updateField("event_date", event.target.value)} className="admin-input" /></EditField>
          <EditField label="Zona"><select value={values.service_zone} onChange={(event) => updateField("service_zone", event.target.value as ServiceZoneKey)} className="admin-input admin-select">{zoneOptions.map((zone) => <option key={zone.value} value={zone.value}>{zone.label}</option>)}</select></EditField>
          <EditField label="Lugar exacto" full><input value={values.service_location} onChange={(event) => updateField("service_location", event.target.value)} className="admin-input" /><p className="mt-2 text-xs leading-5 text-white/35">{selectedZone.description}</p></EditField>
          <EditField label="Horas"><input type="number" min="0" step="1" value={values.duration_hours_value} onChange={(event) => updateField("duration_hours_value", event.target.value)} className="admin-input" /></EditField>
          <EditField label="Minutos"><input type="number" min="0" max="59" step="1" value={values.duration_minutes_value} onChange={(event) => updateField("duration_minutes_value", event.target.value)} className="admin-input" /></EditField>
          <EditField label="Cantidad"><input type="number" min="1" value={values.quantity} onChange={(event) => updateField("quantity", event.target.value)} className="admin-input" /></EditField>
          <EditField label="Invitados"><input type="number" min="0" value={values.guest_count} onChange={(event) => updateField("guest_count", event.target.value)} className="admin-input" /></EditField>
          <EditField label="Paquete seleccionado"><input value={values.selected_package} onChange={(event) => updateField("selected_package", event.target.value)} placeholder="Ej: Memoria, Ideal, Esencial, Personalizado" className="admin-input" /></EditField>
          <EditField label="Valor final"><input type="number" min="0" step="1000" value={values.final_price_cop} onChange={(event) => updateField("final_price_cop", event.target.value)} placeholder="Ej: 1600000" className="admin-input" /></EditField>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <ToggleEdit label="Entrega digital" active={values.digital_delivery} onClick={() => updateField("digital_delivery", !values.digital_delivery)} />
          <ToggleEdit label="Entrega impresa" active={values.printed_delivery} onClick={() => updateField("printed_delivery", !values.printed_delivery)} />
          <ToggleEdit label="Álbum / marco / cartilla" active={values.special_deliverable} onClick={() => updateField("special_deliverable", !values.special_deliverable)} />
        </div>

        <EditField label="Detalles adicionales" full className="mt-5 block"><textarea value={values.details} onChange={(event) => updateField("details", event.target.value)} rows={4} className="admin-input resize-none" /></EditField>
        <EditField label="Notas internas" full className="mt-5 block"><textarea value={values.admin_notes} onChange={(event) => updateField("admin_notes", event.target.value)} rows={3} placeholder="Notas solo para administración." className="admin-input resize-none" /></EditField>
        <EditField label="Notas internas de precio" full className="mt-5 block"><textarea value={values.internal_pricing_notes || estimate.pricingNotes} onChange={(event) => updateField("internal_pricing_notes", event.target.value)} rows={4} className="admin-input resize-none" /></EditField>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-white/35">Referencia interna</p>
          <p className="mt-2 text-2xl font-semibold">{estimate.label}</p>
          <p className="mt-2 text-xs leading-5 text-white/40">Valor final definido: {estimate.finalLabel}</p>
          <p className="mt-2 text-xs leading-5 text-white/40">Este valor no se muestra al cliente desde la web. Solo se usa para administración y para enviar la cotización final después de la reunión.</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={onCancel} disabled={saving} className="rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:border-white/35 hover:text-white disabled:opacity-60">Cancelar</button>
          <button type="submit" disabled={saving} className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Guardando..." : "Guardar cambios"}</button>
        </div>
      </div>
    </form>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-[0.25em] text-white/35">{label}</p><p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{value}</p></article>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><p className="text-xs uppercase tracking-[0.22em] text-white/35">{label}</p><p className="mt-2 break-words text-sm font-medium text-white/80">{value}</p></div>;
}

function TextBlock({ title, text }: { title: string; text: string | null }) {
  return <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5"><p className="text-xs uppercase tracking-[0.25em] text-white/35">{title}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/60">{text || "Sin información."}</p></div>;
}

function MiniFlag({ label, active }: { label: string; active: boolean }) {
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${active ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.03] text-white/35"}`}>{label}: {active ? "Sí" : "No"}</div>;
}

function EditField({ label, children, full = false, className = "" }: { label: string; children: ReactNode; full?: boolean; className?: string }) {
  return <label className={`${full ? "sm:col-span-2" : ""} ${className}`}><span className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">{label}</span>{children}</label>;
}

function ToggleEdit({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${active ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white"}`}>{label}: {active ? "Sí" : "No"}</button>;
}

function StatusBadge({ status }: { status: string }) {
  const label = statusLabels[status] ?? status;
  const className =
    status === "reserved"
      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100/80"
      : status === "approved"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100/80"
      : status === "proposal_sent"
      ? "border-blue-400/20 bg-blue-400/10 text-blue-100/80"
      : status === "completed"
      ? "border-violet-400/20 bg-violet-400/10 text-violet-100/80"
      : status === "cancelled" || status === "rejected"
      ? "border-red-400/20 bg-red-400/10 text-red-100/80"
      : status === "new_travel_review"
      ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-100/80"
      : status === "reviewing"
      ? "border-white/15 bg-white/[0.06] text-white/70"
      : "border-white/10 bg-white/[0.03] text-white/55";
  return <span className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs ${className}`}>{label}</span>;
}

function ReservationBadge({ status }: { status: string }) {
  const label = reservationStatusLabels[status] ?? status;
  const className =
    status === "reserved"
      ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-100/80"
      : status === "no_deposit_required"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100/80"
      : "border-yellow-400/20 bg-yellow-400/10 text-yellow-100/80";

  return <span className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs ${className}`}>{label}</span>;
}
