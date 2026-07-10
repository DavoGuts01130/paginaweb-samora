"use client";

import { useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

const whatsappNumber =
  process.env.NEXT_PUBLIC_SAMORA_WHATSAPP_NUMBER ?? "573192709536";

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
  description: string;
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

const quoteRules: Record<ServiceKey, QuoteRule> = {
  sesion_individual: {
    label: "Sesión individual / retrato",
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
  mascotas: {
    label: "Mascotas",
    description:
      "Sesiones para mascotas, familias con mascotas o recuerdos especiales.",
    min: 160000,
    max: 320000,
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

const serviceOptions = Object.entries(quoteRules).map(([value, rule]) => ({
  value: value as ServiceKey,
  label: rule.label,
}));

const zoneOptions = Object.entries(serviceZones).map(([value, zone]) => ({
  value: value as ServiceZoneKey,
  label: zone.label,
}));

function formatCOP(value: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

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

function getDurationTotalMinutes(hoursValue: string, minutesValue: string) {
  const hours = Math.max(Number(hoursValue) || 0, 0);
  const minutes = Math.max(Number(minutesValue) || 0, 0);

  return hours * 60 + minutes;
}

function getDurationLabel(hoursValue: string, minutesValue: string) {
  const hours = Math.max(Number(hoursValue) || 0, 0);
  const minutes = Math.max(Number(minutesValue) || 0, 0);

  if (hours === 0 && minutes === 0) {
    return "Por definir";
  }

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? "minuto" : "minutos"}`);
  }

  return parts.join(" y ");
}

export default function ServiceQuoteForm() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] =
    useState<ServiceKey>("sesion_individual");
  const [date, setDate] = useState("");
  const [serviceZone, setServiceZone] =
    useState<ServiceZoneKey>("guatavita");
  const [location, setLocation] = useState("");
  const [durationHoursValue, setDurationHoursValue] = useState("2");
  const [durationMinutesValue, setDurationMinutesValue] = useState("0");
  const [quantity, setQuantity] = useState("1");
  const [digitalDelivery, setDigitalDelivery] = useState(true);
  const [printedDelivery, setPrintedDelivery] = useState(false);
  const [albumOrFrame, setAlbumOrFrame] = useState(false);
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

  const estimate = useMemo(() => {
    const parsedQuantity = Math.max(Number(quantity) || 0, 0);

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

    const totalMin = baseMin + surchargeMin;
    const totalMax = baseMax + surchargeMax;

    return {
      baseMin: Math.round(baseMin),
      baseMax: Math.round(baseMax),
      surchargePercent,
      surchargeMin: Math.round(surchargeMin),
      surchargeMax: Math.round(surchargeMax),
      totalMin: Math.round(totalMin),
      totalMax: Math.round(totalMax),
      label: `${formatCOP(Math.round(totalMin))} - ${formatCOP(
        Math.round(totalMax)
      )}`,
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
  }, [
    albumOrFrame,
    durationHours,
    printedDelivery,
    quantity,
    selectedRule,
    selectedZone,
  ]);

  function buildWhatsappMessage(quoteCode: string) {
    const quantityLabel = selectedRule.unitLabel
      ? `${quantity || "Por definir"} ${selectedRule.unitLabel}(s)`
      : `${quantity || "Por definir"}`;

    const travelLine = selectedZone.requiresTravelReview
      ? "Requiere revisión manual por desplazamiento."
      : `Recargo estimado: ${selectedZone.surchargePercent}% (${estimate.surchargeLabel})`;

    const travelNote = selectedZone.requiresTravelReview
      ? "Al ser un servicio fuera de Cundinamarca, el valor final puede variar según transporte, hospedaje, alimentación, tiempos de traslado y disponibilidad."
      : "El valor puede ajustarse según disponibilidad, ubicación exacta, complejidad del servicio y condiciones finales de entrega.";

    const lines = [
      "*SAMORA STUDIO*",
      "*Solicitud de cotización*",
      "",
      "--------------------------------",
      `*Código:* ${quoteCode}`,
      `*Cliente:* ${name || "Por completar"}`,
      `*WhatsApp:* ${phone || "Por completar"}`,
      "",
      "*Servicio solicitado*",
      `- Tipo: ${selectedRule.label}`,
      `- Fecha aproximada: ${date || "Por definir"}`,
      `- Zona: ${selectedZone.label}`,
      `- Lugar exacto: ${location || "Por definir"}`,
      `- Duración estimada: ${durationLabel}`,
      `- Cantidad aproximada: ${quantityLabel}`,
      "",
      "*Entregables*",
      `- Entrega digital: ${digitalDelivery ? "Sí" : "No"}`,
      `- Entrega impresa: ${printedDelivery ? "Sí" : "No"}`,
      `- Álbum, marco, cartilla o entregable especial: ${
        albumOrFrame ? "Sí" : "No"
      }`,
      "",
      "*Estimación generada por la web*",
      `- Valor base estimado: ${estimate.baseLabel}`,
      `- Desplazamiento: ${travelLine}`,
      `- Rango estimado: *${estimate.label}*`,
      "",
      "*Nota importante*",
      travelNote,
      "",
      "Este valor es orientativo y debe ser confirmado por Samora Studio antes de aprobar el servicio.",
      "",
      "*Detalles adicionales*",
      details || "Sin detalles adicionales.",
      "",
      "--------------------------------",
      "Cotización generada desde la página web de Samora Studio.",
    ];

    return lines.join("\n");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const quoteCode = generateQuoteCode();
    const finalWhatsappMessage = buildWhatsappMessage(quoteCode);

    const { error } = await supabase.from("quote_requests").insert({
      quote_code: quoteCode,

      customer_name: name || null,
      customer_phone: phone || null,

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

      requires_travel_review: selectedZone.requiresTravelReview,
      requires_manual_review: true,

      whatsapp_message: finalWhatsappMessage,

      status: selectedZone.requiresTravelReview ? "new_travel_review" : "new",
    });

    if (error) {
      setMessage(`No se pudo guardar la cotización: ${error.message}`);
      setSaving(false);
      return;
    }

    const finalWhatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      finalWhatsappMessage
    )}`;

    setMessage("Cotización guardada. Abriendo WhatsApp...");
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
            Cotización automática
          </p>

          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">
            Calcula un valor estimado y envíalo por WhatsApp.
          </h2>

          <p className="mt-5 text-sm leading-6 text-white/50 sm:text-base sm:leading-7">
            Este formulario genera una cotización orientativa según el tipo de
            servicio, duración, cantidad, entregables y zona del servicio. El
            valor final debe ser confirmado por Samora Studio.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
            <p className="text-sm uppercase tracking-[0.25em] text-white/35">
              Estimado actual
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {estimate.label}
            </p>

            {estimate.surchargePercent > 0 && (
              <p className="mt-3 text-sm leading-6 text-white/45">
                Incluye recargo estimado de desplazamiento del{" "}
                {estimate.surchargePercent}%.
              </p>
            )}

            {selectedZone.requiresTravelReview && (
              <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                <p className="text-sm leading-6 text-yellow-100/80">
                  Este servicio requiere revisión manual por desplazamiento. El
                  valor final puede variar según transporte, hospedaje,
                  alimentación, tiempos de traslado y disponibilidad.
                </p>
              </div>
            )}

            <p className="mt-3 text-sm leading-6 text-white/45">
              Rango sujeto a disponibilidad, ubicación, complejidad del servicio
              y condiciones finales de entrega.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-[1.5rem] border border-white/10 bg-black/45 p-5 sm:p-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Tu nombre"
                className="input-quote"
              />
            </Field>

            <Field label="WhatsApp">
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Ej: 319 000 0000"
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
                placeholder="Ej: Guatavita, Sesquilé, Bogotá, Medellín..."
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
                Duración seleccionada: {durationLabel}
              </p>
            </Field>

            <Field
              label={
                selectedRule.unitLabel
                  ? `Cantidad de ${selectedRule.unitLabel}s`
                  : "Cantidad"
              }
              full
            >
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="input-quote"
              />
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
              placeholder="Cuéntanos qué tienes en mente, número de personas, tipo de entrega, referencias o cualquier detalle importante."
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
              ? "Guardando cotización..."
              : "Enviar cotización por WhatsApp"}
          </button>

          {message && (
            <p className="mt-3 text-center text-xs leading-5 text-white/45">
              {message}
            </p>
          )}

          <p className="mt-3 text-center text-xs leading-5 text-white/35">
            La cotización será guardada y enviada a Samora Studio para revisar
            disponibilidad, detalles y valor final.
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