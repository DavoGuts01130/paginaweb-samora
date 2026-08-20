"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

const whatsappNumber =
  process.env.NEXT_PUBLIC_SAMORA_WHATSAPP_NUMBER ?? "573138429568";

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
  // Valores antiguos para compatibilidad con cotizaciones existentes.
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
  // Valores antiguos para compatibilidad con cotizaciones existentes.
  | "municipio_cercano"
  | "bogota_sabana";

type MeetingType = "por_definir" | "virtual" | "presencial" | "whatsapp";

type QuoteRule = {
  label: string;
  description: string;
  min: number;
  max: number;
  perHourMin?: number;
  perHourMax?: number;
  perUnitMin?: number;
  perUnitMax?: number;
  unitLabel?: string;
  asksGuestCount?: boolean;
};

type ServiceZoneRule = {
  label: string;
  description: string;
  surchargePercent: number;
  requiresTravelReview: boolean;
};

const quoteRules: Record<ServiceKey, QuoteRule> = {
  matrimonio_boda: {
    label: "Matrimonio / boda",
    description:
      "Cobertura de ceremonia, recepción, sesión de pareja, video, álbum, photobook o recuerdos físicos según el paquete acordado.",
    min: 1250000,
    max: 1800000,
    perHourMin: 90000,
    perHourMax: 160000,
    asksGuestCount: true,
  },
  quince_anos: {
    label: "Quince años",
    description:
      "Cobertura de celebración, sesión previa, recepción, familiares, invitados, detalles y entregables digitales o impresos.",
    min: 650000,
    max: 1800000,
    perHourMin: 90000,
    perHourMax: 160000,
    asksGuestCount: true,
  },
  bautizo: {
    label: "Bautizo",
    description:
      "Registro de ceremonia, familia, invitados, detalles y momentos importantes de la celebración.",
    min: 450000,
    max: 1200000,
    perHourMin: 80000,
    perHourMax: 140000,
    asksGuestCount: true,
  },
  cumpleanos: {
    label: "Cumpleaños",
    description:
      "Cobertura de celebración familiar o social, invitados, detalles, decoración y momentos principales.",
    min: 380000,
    max: 1200000,
    perHourMin: 70000,
    perHourMax: 130000,
    asksGuestCount: true,
  },
  grados_escolares: {
    label: "Grados / eventos escolares",
    description:
      "Paquetes escolares con fotos individuales, grupales, cartilla o entregables impresos.",
    min: 700000,
    max: 1600000,
    perUnitMin: 22000,
    perUnitMax: 45000,
    unitLabel: "estudiante",
    asksGuestCount: true,
  },
  evento_empresarial: {
    label: "Evento empresarial",
    description:
      "Cobertura para reuniones, lanzamientos, conferencias, actividades corporativas y contenido visual para marcas.",
    min: 650000,
    max: 1800000,
    perHourMin: 90000,
    perHourMax: 160000,
    asksGuestCount: true,
  },
  retrato_individual: {
    label: "Retrato individual / profesional",
    description:
      "Retratos personales, profesionales, artísticos o marca personal.",
    min: 180000,
    max: 350000,
    perHourMin: 40000,
    perHourMax: 70000,
  },
  pareja_embarazo: {
    label: "Pareja / embarazo",
    description:
      "Sesiones emocionales para pareja, compromiso, embarazo o familia.",
    min: 220000,
    max: 480000,
    perHourMin: 50000,
    perHourMax: 90000,
  },
  familiar: {
    label: "Sesión familiar",
    description:
      "Sesiones familiares, recuerdos especiales, grupos pequeños o momentos compartidos.",
    min: 220000,
    max: 520000,
    perHourMin: 50000,
    perHourMax: 90000,
  },
  mascotas: {
    label: "Mascotas",
    description:
      "Sesiones para mascotas, familias con mascotas o recuerdos especiales.",
    min: 160000,
    max: 320000,
    perHourMin: 40000,
    perHourMax: 70000,
  },
  producto: {
    label: "Fotografía de producto",
    description:
      "Fotos para productos, catálogos, tiendas, emprendimientos, redes sociales o material comercial.",
    min: 250000,
    max: 750000,
    perUnitMin: 25000,
    perUnitMax: 60000,
    unitLabel: "producto/foto",
  },
  gastronomia: {
    label: "Fotografía gastronómica / coctelería",
    description:
      "Fotografía para restaurantes, platos, bebidas, coctelería, menús, redes sociales y campañas de marca.",
    min: 250000,
    max: 850000,
    perUnitMin: 25000,
    perUnitMax: 60000,
    unitLabel: "producto/foto",
  },
  hospedaje_espacios: {
    label: "Hospedajes / espacios / inmobiliaria",
    description:
      "Fotografía para hospedajes, casas, espacios comerciales, experiencias, locaciones o inmuebles.",
    min: 280000,
    max: 950000,
    perUnitMin: 25000,
    perUnitMax: 70000,
    unitLabel: "espacio/foto",
  },
  impresiones: {
    label: "Impresiones / marcos / recuerdos",
    description:
      "Productos impresos, fotos con marco, copias, recuerdos y entregas físicas.",
    min: 30000,
    max: 180000,
    perUnitMin: 15000,
    perUnitMax: 80000,
    unitLabel: "unidad",
  },
  web_software: {
    label: "Desarrollo web / software",
    description:
      "Páginas web, catálogos, tiendas, sistemas internos o herramientas digitales.",
    min: 800000,
    max: 4500000,
  },
  otro: {
    label: "Otro servicio personalizado",
    description:
      "Solicitud especial que requiere revisión personalizada por el equipo de Samora Estudio.",
    min: 250000,
    max: 1800000,
  },

  // Compatibilidad con registros anteriores.
  sesion_individual: {
    label: "Sesión individual / retrato",
    description:
      "Retratos personales, profesionales, artísticos o marca personal.",
    min: 180000,
    max: 350000,
    perHourMin: 40000,
    perHourMax: 70000,
  },
  evento_social: {
    label: "Evento social / empresarial",
    description:
      "Bodas, bautizos, quince años, eventos empresariales o celebraciones.",
    min: 650000,
    max: 1800000,
    perHourMin: 90000,
    perHourMax: 160000,
    asksGuestCount: true,
  },
  grados: {
    label: "Grados / colegio",
    description:
      "Paquetes escolares con fotos individuales, grupales, cartilla o entregables impresos.",
    min: 700000,
    max: 1600000,
    perUnitMin: 22000,
    perUnitMax: 45000,
    unitLabel: "estudiante",
    asksGuestCount: true,
  },
  producto_marca: {
    label: "Fotografía de producto / gastronomía",
    description:
      "Fotos para restaurantes, productos, espacios, hospedajes, marcas o redes.",
    min: 250000,
    max: 750000,
    perUnitMin: 25000,
    perUnitMax: 60000,
    unitLabel: "producto/foto",
  },
};

const serviceZones: Record<ServiceZoneKey, ServiceZoneRule> = {
  guatavita: {
    label: "Guatavita",
    description: "Servicio dentro de Guatavita.",
    surchargePercent: 0,
    requiresTravelReview: false,
  },
  sabana_norte: {
    label: "Sabana norte",
    description:
      "Sesquilé, Guasca, Sopó, Tocancipá, Gachancipá, Chía, Cajicá, Zipaquirá y alrededores.",
    surchargePercent: 10,
    requiresTravelReview: false,
  },
  bogota: {
    label: "Bogotá",
    description: "Servicio dentro de Bogotá o zonas urbanas cercanas.",
    surchargePercent: 10,
    requiresTravelReview: false,
  },
  cundinamarca_lejano: {
    label: "Cundinamarca lejano",
    description: "Municipios más alejados dentro de Cundinamarca.",
    surchargePercent: 25,
    requiresTravelReview: false,
  },
  fuera_cundinamarca: {
    label: "Fuera de Cundinamarca",
    description:
      "Servicios fuera de Cundinamarca con desplazamiento estándar. Casos lejanos o especiales se revisan manualmente.",
    surchargePercent: 30,
    requiresTravelReview: false,
  },
  especial_fuera_cobertura: {
    label: "Solicitud especial / destino lejano",
    description:
      "Cartagena, Costa, otra ciudad lejana o servicio que requiera vuelos, hospedaje o logística especial. No tiene porcentaje fijo.",
    surchargePercent: 0,
    requiresTravelReview: true,
  },

  // Compatibilidad con registros anteriores.
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
    surchargePercent: 10,
    requiresTravelReview: false,
  },
};

const publicServiceKeys: ServiceKey[] = [
  "matrimonio_boda",
  "quince_anos",
  "bautizo",
  "cumpleanos",
  "grados_escolares",
  "evento_empresarial",
  "retrato_individual",
  "pareja_embarazo",
  "familiar",
  "mascotas",
  "producto",
  "gastronomia",
  "hospedaje_espacios",
  "impresiones",
  "web_software",
  "otro",
];

const publicZoneKeys: ServiceZoneKey[] = [
  "guatavita",
  "sabana_norte",
  "bogota",
  "cundinamarca_lejano",
  "fuera_cundinamarca",
  "especial_fuera_cobertura",
];

const serviceOptions = publicServiceKeys.map((value) => ({
  value,
  label: quoteRules[value].label,
}));

const zoneOptions = publicZoneKeys.map((value) => ({
  value,
  label: serviceZones[value].label,
}));

function generateQuoteCode() {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replaceAll("-", "");
  const timePart = date.toTimeString().slice(0, 8).replaceAll(":", "");
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `COT-${datePart}-${timePart}-${randomPart}`;
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

function getDurationLabel(hoursValue: string, minutesValue: string) {
  const hours = Math.max(Number(hoursValue) || 0, 0);
  const minutes = Math.max(Number(minutesValue) || 0, 0);

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

function getEstimate({
  serviceType,
  serviceZone,
  durationHours,
  quantity,
  printedDelivery,
  albumOrFrame,
}: {
  serviceType: ServiceKey;
  serviceZone: ServiceZoneKey;
  durationHours: number;
  quantity: string;
  printedDelivery: boolean;
  albumOrFrame: boolean;
}) {
  const selectedRule = quoteRules[serviceType];
  const selectedZone = serviceZones[serviceZone];
  const parsedQuantity = Math.max(Number(quantity) || 0, 0);
  const billableHours = getBillableHours(durationHours);

  let baseMin = selectedRule.min;
  let baseMax = selectedRule.max;

  if (selectedRule.perHourMin && billableHours > 4) {
    const extraHours = billableHours - 4;

    baseMin += extraHours * selectedRule.perHourMin;
    baseMax +=
      extraHours * (selectedRule.perHourMax ?? selectedRule.perHourMin);
  }

  if (selectedRule.perUnitMin && parsedQuantity > 1) {
    const extraUnits = parsedQuantity - 1;

    baseMin += extraUnits * selectedRule.perUnitMin;
    baseMax +=
      extraUnits * (selectedRule.perUnitMax ?? selectedRule.perUnitMin);
  }

  if (printedDelivery) {
    baseMin += 80000;
    baseMax += 280000;
  }

  if (albumOrFrame) {
    baseMin += 120000;
    baseMax += 650000;
  }

  const surchargePercent = selectedZone.requiresTravelReview
    ? 0
    : selectedZone.surchargePercent;

  const surchargeMin = baseMin * (surchargePercent / 100);
  const surchargeMax = baseMax * (surchargePercent / 100);

  return {
    baseMin: Math.round(baseMin),
    baseMax: Math.round(baseMax),
    surchargePercent,
    surchargeMin: Math.round(surchargeMin),
    surchargeMax: Math.round(surchargeMax),
    totalMin: Math.round(baseMin + surchargeMin),
    totalMax: Math.round(baseMax + surchargeMax),
    billableHours,
  };
}

function buildInternalPricingNotes({
  durationHours,
  billableHours,
  selectedZone,
}: {
  durationHours: number;
  billableHours: number;
  selectedZone: ServiceZoneRule;
}) {
  const notes: string[] = [];

  if (durationHours > 0 && durationHours < 4) {
    notes.push(
      "El cliente solicitó menos de 4 horas. Aplicar mínimo interno de 4 horas por preparación, trabajo y desplazamiento."
    );
  }

  if (durationHours > 8) {
    notes.push(
      "El cliente solicitó más de 8 horas. Revisar recargo, disponibilidad del equipo, alimentación, transporte y condiciones especiales."
    );
  }

  if (selectedZone.requiresTravelReview) {
    notes.push(
      "Destino especial o fuera de cobertura estándar. No aplicar porcentaje fijo; revisar transporte, hospedaje, vuelos, alimentación, tiempos de traslado y disponibilidad."
    );
  } else if (selectedZone.surchargePercent > 0) {
    notes.push(
      `Recargo interno de desplazamiento sugerido: ${selectedZone.surchargePercent}%.`
    );
  }

  notes.push(`Horas facturables internas de referencia: ${billableHours}.`);
  notes.push(
    "No mostrar valores al cliente. La cotización final se define después de revisar detalles o realizar reunión."
  );

  return notes.join("\n");
}

export default function ServiceQuoteForm() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [customerDocument, setCustomerDocument] = useState("");
  const [serviceType, setServiceType] = useState<ServiceKey>("matrimonio_boda");
  const [date, setDate] = useState("");
  const [serviceZone, setServiceZone] = useState<ServiceZoneKey>("guatavita");
  const [location, setLocation] = useState("");
  const [durationHoursValue, setDurationHoursValue] = useState("4");
  const [durationMinutesValue, setDurationMinutesValue] = useState("0");
  const [quantity, setQuantity] = useState("1");
  const [guestCount, setGuestCount] = useState("");
  const [digitalDelivery, setDigitalDelivery] = useState(true);
  const [printedDelivery, setPrintedDelivery] = useState(false);
  const [albumOrFrame, setAlbumOrFrame] = useState(false);
  const [meetingType, setMeetingType] = useState<MeetingType>("por_definir");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedRule = quoteRules[serviceType];
  const selectedZone = serviceZones[serviceZone];

  const durationHours = useMemo(
    () => getDurationHours(durationHoursValue, durationMinutesValue),
    [durationHoursValue, durationMinutesValue]
  );

  const durationTotalMinutes = useMemo(
    () => getDurationTotalMinutes(durationHoursValue, durationMinutesValue),
    [durationHoursValue, durationMinutesValue]
  );

  const durationLabel = useMemo(
    () => getDurationLabel(durationHoursValue, durationMinutesValue),
    [durationHoursValue, durationMinutesValue]
  );

  const estimate = useMemo(
    () =>
      getEstimate({
        serviceType,
        serviceZone,
        durationHours,
        quantity,
        printedDelivery,
        albumOrFrame,
      }),
    [
      albumOrFrame,
      durationHours,
      printedDelivery,
      quantity,
      serviceType,
      serviceZone,
    ]
  );

  const internalPricingNotes = useMemo(
    () =>
      buildInternalPricingNotes({
        durationHours,
        billableHours: estimate.billableHours,
        selectedZone,
      }),
    [durationHours, estimate.billableHours, selectedZone]
  );

  const showGuestCount = selectedRule.asksGuestCount;

  function buildWhatsappMessage(quoteCode: string) {
    const quantityLabel = selectedRule.unitLabel
      ? `${quantity || "Por definir"} ${selectedRule.unitLabel}(s)`
      : `${quantity || "Por definir"}`;

    const meetingLabel =
      meetingType === "virtual"
        ? "Reunión virtual"
        : meetingType === "presencial"
        ? "Reunión presencial"
        : meetingType === "whatsapp"
        ? "Continuar por WhatsApp"
        : "Por definir con el equipo";

    const lines = [
      "*SAMORA ESTUDIO*",
      "*Nueva solicitud de cotización*",
      "",
      "--------------------------------",
      `*Código:* ${quoteCode}`,
      `*Cliente:* ${name || "Por completar"}`,
      `*WhatsApp:* ${phone || "Por completar"}`,
      `*Correo:* ${email || "Por completar"}`,
      `*Documento:* ${customerDocument || "Por completar"}`,
      "",
      "*Servicio solicitado*",
      `- Tipo: ${selectedRule.label}`,
      `- Fecha aproximada: ${date || "Por definir"}`,
      `- Zona: ${selectedZone.label}`,
      `- Lugar exacto: ${location || "Por definir"}`,
      `- Duración estimada: ${durationLabel}`,
      `- Cantidad aproximada: ${quantityLabel}`,
      `- Invitados: ${
        showGuestCount ? guestCount || "Por definir" : "No aplica / no indicado"
      }`,
      "",
      "*Entregables solicitados*",
      `- Entrega digital: ${digitalDelivery ? "Sí" : "No"}`,
      `- Entrega impresa: ${printedDelivery ? "Sí" : "No"}`,
      `- Álbum, marco, cartilla o entregable especial: ${
        albumOrFrame ? "Sí" : "No"
      }`,
      "",
      "*Reunión de definición*",
      `- Preferencia del cliente: ${meetingLabel}`,
      "- El equipo de Samora Estudio revisará la solicitud y coordinará una reunión o conversación para definir detalles, disponibilidad, entregables y condiciones finales.",
      "",
      "*Detalles adicionales*",
      details || "Sin detalles adicionales.",
      "",
      "--------------------------------",
      "Solicitud generada desde la página web de Samora Estudio.",
    ];

    return lines.join("\n");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const quoteCode = generateQuoteCode();
    const finalWhatsappMessage = buildWhatsappMessage(quoteCode);

    const shouldReviewTravel = selectedZone.requiresTravelReview;
    const shouldReviewDuration = durationHours > 8;

    const { error } = await supabase.from("quote_requests").insert({
      quote_code: quoteCode,

      customer_name: name || null,
      customer_phone: phone || null,
      customer_email: email || null,
      customer_document: customerDocument || null,

      service_type: serviceType,
      service_label: selectedRule.label,

      event_date: date || null,
      service_zone: serviceZone,
      service_zone_label: selectedZone.label,
      service_location: location || null,

      duration_value: durationTotalMinutes,
      duration_unit: "minutos_totales",
      duration_hours: durationHours,

      quantity: Number(quantity) || null,
      guest_count: showGuestCount ? Number(guestCount) || null : null,

      digital_delivery: digitalDelivery,
      printed_delivery: printedDelivery,
      special_deliverable: albumOrFrame,

      details: details || null,

      base_min_cop: estimate.baseMin,
      base_max_cop: estimate.baseMax,

      travel_surcharge_percent: estimate.surchargePercent,
      travel_surcharge_min_cop: estimate.surchargeMin,
      travel_surcharge_max_cop: estimate.surchargeMax,

      estimated_min_cop: estimate.totalMin,
      estimated_max_cop: estimate.totalMax,

      requires_travel_review: shouldReviewTravel,
      requires_manual_review: true,
      internal_pricing_notes: internalPricingNotes,

      meeting_requested: true,
      meeting_type: meetingType,
      meeting_status: "pendiente_programar",

      whatsapp_message: finalWhatsappMessage,

      status:
        shouldReviewTravel || shouldReviewDuration ? "new_travel_review" : "new",
    });

    if (error) {
      setMessage(`No se pudo guardar la solicitud: ${error.message}`);
      setSaving(false);
      return;
    }

    const finalWhatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      finalWhatsappMessage
    )}`;

    setMessage("Solicitud guardada. Abriendo WhatsApp...");
    setSaving(false);

    window.open(finalWhatsappLink, "_blank", "noopener,noreferrer");
  }

  return (
    <section
      id="cotizador"
      className="mt-14 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-7 md:mt-16 md:p-8 lg:p-10"
    >
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/35">
            Solicitud personalizada
          </p>

          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">
            Realiza tu solicitud y coordinamos una propuesta final contigo.
          </h2>

          <p className="mt-5 text-sm leading-6 text-white/50 sm:text-base sm:leading-7">
            Completa la información inicial de tu servicio. El equipo de Samora
            Estudio revisará la solicitud y podrá programar una reunión virtual
            o presencial para definir detalles, disponibilidad, entregables y
            valor final.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-white/35">
              Siguiente paso
            </p>

            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
              Revisión y reunión de definición
            </p>

            <p className="mt-3 text-sm leading-6 text-white/45">
              No mostramos valores automáticos en la web. La cotización final se
              envía únicamente después de revisar el servicio, resolver dudas y
              confirmar las condiciones con el cliente.
            </p>

            {selectedZone.requiresTravelReview && (
              <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                <p className="text-sm leading-6 text-yellow-100/80">
                  Esta zona requiere revisión especial de desplazamiento. El
                  equipo definirá transporte, hospedaje, tiempos y logística
                  antes de enviar una propuesta final.
                </p>
              </div>
            )}
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[1.5rem] border border-white/10 bg-black/45 p-5 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Tu nombre"
                className="input-quote"
              />
            </Field>

            <Field label="WhatsApp">
              <input
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Ej: 319 000 0000"
                className="input-quote"
              />
            </Field>

            <Field label="Correo electrónico">
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="correo@ejemplo.com"
                className="input-quote"
              />
            </Field>

            <Field label="Cédula o documento">
              <input
                required
                value={customerDocument}
                onChange={(event) => setCustomerDocument(event.target.value)}
                placeholder="Ej: 1000000000"
                className="input-quote"
              />
            </Field>

            <Field label="Tipo de servicio" full>
              <select
                value={serviceType}
                onChange={(event) =>
                  setServiceType(event.target.value as ServiceKey)
                }
                className="input-quote"
              >
                {serviceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs leading-5 text-white/35">
                {selectedRule.description}
              </p>
            </Field>

            <Field label="Fecha aproximada">
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="input-quote"
              />
            </Field>

            <Field label="Zona del servicio">
              <select
                value={serviceZone}
                onChange={(event) =>
                  setServiceZone(event.target.value as ServiceZoneKey)
                }
                className="input-quote"
              >
                {zoneOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Lugar exacto" full>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Ej: Guatavita, Bogotá, Cartagena, nombre del lugar..."
                className="input-quote"
              />

              <p className="mt-2 text-xs leading-5 text-white/35">
                {selectedZone.description}
              </p>
            </Field>

            <Field label="Duración estimada" full>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={durationHoursValue}
                    onChange={(event) =>
                      setDurationHoursValue(event.target.value)
                    }
                    placeholder="Horas"
                    className="input-quote"
                  />

                  <p className="mt-2 text-xs text-white/35">Horas</p>
                </div>

                <div>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="1"
                    value={durationMinutesValue}
                    onChange={(event) =>
                      setDurationMinutesValue(event.target.value)
                    }
                    placeholder="Minutos"
                    className="input-quote"
                  />

                  <p className="mt-2 text-xs text-white/35">Minutos</p>
                </div>
              </div>

              <p className="mt-2 text-xs leading-5 text-white/35">
                Duración seleccionada: {durationLabel}. Si es menor a 4 horas,
                el equipo revisará la tarifa mínima interna. Si supera 8 horas,
                se evaluarán condiciones adicionales.
              </p>
            </Field>

            <Field
              label={
                selectedRule.unitLabel
                  ? `Cantidad de ${selectedRule.unitLabel}s`
                  : "Cantidad aproximada"
              }
              full={!showGuestCount}
            >
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="input-quote"
              />
            </Field>

            {showGuestCount && (
              <Field label="Cantidad de invitados">
                <input
                  type="number"
                  min="0"
                  value={guestCount}
                  onChange={(event) => setGuestCount(event.target.value)}
                  placeholder="Ej: 100"
                  className="input-quote"
                />
              </Field>
            )}

            <Field label="Preferencia de reunión" full>
              <select
                value={meetingType}
                onChange={(event) =>
                  setMeetingType(event.target.value as MeetingType)
                }
                className="input-quote"
              >
                <option value="por_definir">Por definir con el equipo</option>
                <option value="virtual">Reunión virtual</option>
                <option value="presencial">Reunión presencial</option>
                <option value="whatsapp">Continuar por WhatsApp</option>
              </select>
            </Field>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <CheckOption
              label="Entrega digital"
              checked={digitalDelivery}
              onChange={setDigitalDelivery}
            />

            <CheckOption
              label="Entrega impresa"
              checked={printedDelivery}
              onChange={setPrintedDelivery}
            />

            <CheckOption
              label="Álbum / marco / cartilla"
              checked={albumOrFrame}
              onChange={setAlbumOrFrame}
            />
          </div>

          <Field label="Detalles adicionales" full className="mt-8 block">
            <textarea
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="Cuéntanos qué tienes en mente: tipo de evento, número de personas, ceremonia, recepción, sesión previa, entregables, referencias, horarios o cualquier detalle importante."
              rows={4}
              className="input-quote resize-none"
            />
          </Field>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Guardando solicitud..."
              : "Enviar solicitud por WhatsApp"}
          </button>

          {message && (
            <p className="mt-3 text-center text-xs leading-5 text-white/45">
              {message}
            </p>
          )}

          <p className="mt-3 text-center text-xs leading-5 text-white/35">
            La solicitud será guardada y enviada a Samora Estudio. El equipo
            revisará disponibilidad, detalles, reunión y valor final antes de
            compartir una cotización formal.
          </p>
        </form>
      </div>

      <style jsx>{`
        .input-quote {
          width: 100%;
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.04);
          padding: 0.85rem 1rem;
          color: white;
          outline: none;
        }

        .input-quote:focus {
          border-color: rgba(255, 255, 255, 0.38);
        }

        .input-quote::placeholder {
          color: rgba(255, 255, 255, 0.28);
        }

        .input-quote option {
          color: black;
          background: white;
        }
      `}</style>
    </section>
  );
}

function Field({
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

function CheckOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
        checked
          ? "border-white bg-white text-black"
          : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="hidden"
      />

      <span>{checked ? "✓" : "+"}</span>
      <span>{label}</span>
    </label>
  );
}