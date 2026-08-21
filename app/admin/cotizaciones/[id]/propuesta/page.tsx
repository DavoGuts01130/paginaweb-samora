import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import PrintProposalButton from "@/components/PrintProposalButton";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Propuesta de cotización | Admin Samora",
  description:
    "Vista imprimible de propuesta comercial para cotizaciones de Samora Estudio.",
};

export const dynamic = "force-dynamic";

type ProposalQuote = {
  id: string;
  quote_code: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_document: string | null;
  service_type: string;
  service_label: string;
  event_date: string | null;
  service_zone_label: string | null;
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
  admin_notes: string | null;
  meeting_type: string | null;
  meeting_status: string | null;
  meeting_date: string | null;
  meeting_start_time: string | null;
  meeting_end_time: string | null;
  meeting_location: string | null;
  meeting_notes: string | null;
  confirmed_event_date: string | null;
  confirmed_start_time: string | null;
  confirmed_end_time: string | null;
  confirmed_location: string | null;
  schedule_notes: string | null;
  selected_package: string | null;
  final_price_cop: number | null;
  final_pdf_url: string | null;
  created_at: string;
};

type TemplateKind =
  | "wedding"
  | "social"
  | "portrait"
  | "commercial"
  | "school"
  | "digital"
  | "general";

type ServiceProfile = {
  kind: TemplateKind;
  eyebrow: string;
  coverTitle: string;
  coverSubtitle: string;
  helloText: string;
  serviceTitle: string;
  serviceIntro: string;
  quantityLabel: string;
  packageLabel: string;
  coverageTitle: string;
  coverageIntro: string;
  coverageItems: string[];
  deliverableTitle: string;
  deliverableItems: string[];
  extras: { title: string; text: string }[];
  portfolioTitle: string;
  closingText: string;
};

const SAMORA_TEAL = "#285564";
const SAMORA_TEAL_DARK = "#214957";
const SAMORA_CREAM = "#f4f1eb";
const SAMORA_CARD = "#e6e6e2";
const HERO_IMAGE = "/hero.png";
const TEAM_OWNER_1_IMAGE = "/samora-team/owner-1.png";
const TEAM_OWNER_2_IMAGE = "/samora-team/owner-2.png";
const TEAM_SIGNATURE = "Jilly&Samantha";
const TEAM_SIGNATURE_SUBTITLE = "Fotografía & diseño";

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "Por definir";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "long",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string | null | undefined) {
  if (!value) return "Por definir";

  const [rawHours, rawMinutes] = value.slice(0, 5).split(":");
  const hours = Number(rawHours);
  const minutes = Number(rawMinutes);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value.slice(0, 5);

  return new Intl.DateTimeFormat("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(2000, 0, 1, hours, minutes));
}

function formatCOP(value: number | null | undefined) {
  if (!value || value <= 0) return "Por definir";

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace("COP", "")
    .trim();
}

function getDurationLabel(quote: ProposalQuote) {
  const totalMinutes = Number(quote.duration_value ?? 0);

  if (quote.duration_unit === "minutos_totales" && totalMinutes > 0) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const parts: string[] = [];

    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "hora" : "horas"}`);
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "minuto" : "minutos"}`);

    return parts.join(" y ");
  }

  if (quote.duration_hours && quote.duration_hours > 0) {
    return `${quote.duration_hours} ${quote.duration_hours === 1 ? "hora" : "horas"}`;
  }

  return "Por definir";
}

function getVisibleClientName(quote: ProposalQuote) {
  return quote.customer_name?.trim() || "Cliente Samora";
}

function getEventDate(quote: ProposalQuote) {
  return quote.confirmed_event_date || quote.event_date;
}

function getEventTime(quote: ProposalQuote) {
  if (quote.confirmed_start_time && quote.confirmed_end_time) {
    return `${formatTime(quote.confirmed_start_time)} - ${formatTime(quote.confirmed_end_time)}`;
  }

  if (quote.confirmed_start_time) return formatTime(quote.confirmed_start_time);
  return "Por confirmar";
}

function getEventLocation(quote: ProposalQuote) {
  return (
    quote.confirmed_location ||
    quote.service_location ||
    quote.service_zone_label ||
    "Por definir"
  );
}

function parseLines(value: string | null | undefined) {
  return (value ?? "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getTemplateKind(serviceType: string): TemplateKind {
  if (
    serviceType === "matrimonio_boda" ||
    serviceType.includes("boda") ||
    serviceType.includes("matrimonio")
  ) {
    return "wedding";
  }

  if (["quince_anos", "bautizo", "cumpleanos", "evento_social"].includes(serviceType)) {
    return "social";
  }

  if (["producto", "gastronomia", "hospedaje_espacios", "producto_marca"].includes(serviceType)) {
    return "commercial";
  }

  if (["retrato_individual", "pareja_embarazo", "familiar", "mascotas", "sesion_individual"].includes(serviceType)) {
    return "portrait";
  }

  if (["grados_escolares", "grados"].includes(serviceType)) return "school";
  if (serviceType === "web_software") return "digital";

  return "general";
}

function getServiceProfile(quote: ProposalQuote): ServiceProfile {
  const kind = getTemplateKind(quote.service_type);

  if (kind === "wedding") {
    return {
      kind,
      eyebrow: "Fotografía de bodas",
      coverTitle: "Servicios",
      coverSubtitle: "& guía de propuesta",
      helloText:
        "En Samora Estudio Creativo nos complace acompañarlos en uno de los momentos más importantes de su vida. Somos un equipo creativo dedicado a la cobertura de eventos sociales, enfocado en capturar cada instante con sensibilidad, elegancia y profesionalismo.",
      serviceTitle: "Servicios",
      serviceIntro:
        "Nos complace presentarles nuestra propuesta de fotografía para bodas, diseñada para capturar cada momento memorable de su día de manera auténtica, elegante y profesional.",
      quantityLabel: "Número de invitados",
      packageLabel: "Paquete seleccionado",
      coverageTitle: "Registro fotográfico y videográfico",
      coverageIntro:
        "Un plan pensado para parejas que desean conservar un recuerdo completo, emocional y detallado de su celebración.",
      coverageItems: [
        "Cobertura fotográfica y videográfica de la ceremonia religiosa, civil o simbólica.",
        "Sesión fotográfica de pareja posterior a la ceremonia o en el momento acordado.",
        "Recepción: entrada, brindis, vals, fotografías familiares, invitados, decoración y momentos espontáneos.",
        "Registro aéreo, reel o pieza audiovisual cuando haga parte del paquete confirmado.",
      ],
      deliverableTitle: "Entregables",
      deliverableItems: [
        "Fotografías digitales editadas en alta resolución.",
        "Álbum digital privado para visualizar, descargar y compartir.",
        "Video, reel, photobook, fotografía enmarcada o recuerdo físico según el paquete aprobado.",
      ],
      extras: [
        {
          title: "Sesión fotográfica y selección",
          text: "El cliente podrá acordar el momento de sesión y selección de fotografías según el paquete aprobado.",
        },
        {
          title: "Confirmación y reservas",
          text: "Se requiere confirmación anticipada y abono acordado para asegurar la fecha del evento.",
        },
        {
          title: "Hora adicional",
          text: "Las horas adicionales deben acordarse con anticipación y se cotizan de forma independiente.",
        },
        {
          title: "Transporte y viáticos",
          text: "Los desplazamientos se validan de acuerdo con el lugar final y las condiciones logísticas del servicio.",
        },
      ],
      portfolioTitle: "Portafolio de nuestros álbumes digitales de boda",
      closingText:
        "Será un honor ser parte de este día especial y capturar esos momentos que recordarán para siempre.",
    };
  }

  if (kind === "social") {
    return {
      kind,
      eyebrow: "Fotografía de eventos sociales",
      coverTitle: "Servicios",
      coverSubtitle: "& propuesta para celebración",
      helloText:
        "Gracias por considerar a Samora Estudio para registrar una celebración tan especial. Nos enfocamos en capturar momentos reales, detalles significativos y recuerdos que puedan conservarse con una presentación cuidada y atemporal.",
      serviceTitle: "Celebración",
      serviceIntro:
        "Esta propuesta está pensada para documentar momentos importantes de la celebración, familiares, invitados, decoración, detalles y recuerdos especiales.",
      quantityLabel: "Número de invitados",
      packageLabel: "Propuesta acordada",
      coverageTitle: "Cobertura del evento",
      coverageIntro:
        "Un acompañamiento visual para conservar los momentos más importantes de la celebración con sensibilidad y profesionalismo.",
      coverageItems: [
        "Registro de momentos principales de la celebración.",
        "Fotografías familiares, invitados, decoración y detalles especiales.",
        "Sesión del protagonista, familia o grupo principal según el evento.",
        "Acompañamiento durante el tiempo de cobertura acordado.",
      ],
      deliverableTitle: "Entregables",
      deliverableItems: [
        "Fotografías digitales editadas en alta resolución.",
        "Selección de mejores fotografías para entrega digital.",
        "Impresiones, marcos, photobook o recuerdos físicos si fueron solicitados.",
      ],
      extras: [
        {
          title: "Agenda del evento",
          text: "Se recomienda definir horarios, momentos clave y logística antes de la celebración.",
        },
        {
          title: "Invitados",
          text: "La cantidad de invitados permite dimensionar el tiempo de cobertura y los entregables.",
        },
        {
          title: "Hora adicional",
          text: "Las horas extra se acuerdan con anticipación y se cotizan según la necesidad del evento.",
        },
        {
          title: "Entrega",
          text: "Los tiempos de entrega dependen del volumen de fotografías, edición y productos físicos.",
        },
      ],
      portfolioTitle: "Portafolio de eventos y celebraciones",
      closingText:
        "Será un gusto acompañar esta celebración y ayudar a conservar sus momentos más importantes.",
    };
  }

  if (kind === "commercial") {
    return {
      kind,
      eyebrow: "Fotografía comercial",
      coverTitle: "Servicios",
      coverSubtitle: "& propuesta para marca",
      helloText:
        "En Samora Estudio creamos imágenes pensadas para comunicar el valor de una marca, producto, espacio o experiencia. Nuestro enfoque combina estética, claridad visual y contenido útil para catálogos, redes sociales, menús o plataformas digitales.",
      serviceTitle: "Marca y producto",
      serviceIntro:
        "Esta propuesta se adapta al número de productos, platos, bebidas, espacios o fotografías requeridas, así como al uso final de las imágenes.",
      quantityLabel: "Productos / fotografías",
      packageLabel: "Propuesta comercial",
      coverageTitle: "Alcance visual",
      coverageIntro:
        "Un registro pensado para presentar productos, espacios o experiencias con una estética cuidada y coherente con la marca.",
      coverageItems: [
        "Registro fotográfico de productos, platos, bebidas, espacios o experiencias.",
        "Composición, encuadre y dirección visual según la intención de marca.",
        "Fotografías para redes sociales, catálogo, menú, tienda online o pauta digital.",
        "Edición cuidada para mantener coherencia visual y presentación profesional.",
      ],
      deliverableTitle: "Entrega comercial",
      deliverableItems: [
        "Fotografías digitales editadas en alta resolución.",
        "Versiones optimizadas para redes sociales o uso digital si aplica.",
        "Entrega organizada según productos, espacios o referencias acordadas.",
      ],
      extras: [
        {
          title: "Preparación",
          text: "Es importante definir referencias visuales, lista de productos, locación y estilo antes de la sesión.",
        },
        {
          title: "Uso de imágenes",
          text: "La propuesta puede adaptarse a redes, catálogo, carta, web o campañas.",
        },
        {
          title: "Producción",
          text: "Utilería, ambientación o dirección adicional pueden acordarse según la necesidad de la marca.",
        },
        {
          title: "Entrega",
          text: "Los archivos se entregan organizados según referencias, productos o categorías acordadas.",
        },
      ],
      portfolioTitle: "Portafolio de fotografía comercial",
      closingText:
        "Esperamos que esta propuesta ayude a fortalecer la presencia visual de tu marca o proyecto.",
    };
  }

  if (kind === "portrait") {
    return {
      kind,
      eyebrow: "Sesión fotográfica",
      coverTitle: "Servicios",
      coverSubtitle: "& propuesta personalizada",
      helloText:
        "Gracias por confiar en Samora Estudio para crear imágenes personales, familiares o artísticas con intención. Buscamos que cada sesión se sienta natural, cuidada y conectada con la historia o personalidad de quien aparece frente a la cámara.",
      serviceTitle: "Sesión",
      serviceIntro:
        "Esta propuesta se adapta al tipo de sesión, número de personas o mascotas, locación, duración, cambios de vestuario y entregables digitales o impresos solicitados.",
      quantityLabel: quote.service_type === "mascotas" ? "Mascotas / participantes" : "Personas incluidas",
      packageLabel: "Propuesta de sesión",
      coverageTitle: "Desarrollo de la sesión",
      coverageIntro:
        "Un acompañamiento cercano para lograr imágenes naturales, cuidadas y coherentes con la intención de la sesión.",
      coverageItems: [
        "Dirección fotográfica durante la sesión.",
        "Registro de retratos, detalles, momentos espontáneos y variaciones de encuadre.",
        "Acompañamiento para lograr una experiencia cómoda y natural.",
        "Selección y edición de fotografías finales según lo acordado.",
      ],
      deliverableTitle: "Entrega",
      deliverableItems: [
        "Fotografías digitales editadas en alta resolución.",
        "Entrega digital organizada para descarga y visualización.",
        "Impresiones, marcos o recuerdos físicos si fueron incluidos en la propuesta.",
      ],
      extras: [
        {
          title: "Preparación de sesión",
          text: "Se pueden definir referencias, vestuario, locación y estilo antes de la fecha acordada.",
        },
        {
          title: "Selección",
          text: "La selección de fotografías finales se acuerda según el paquete o propuesta aprobada.",
        },
        {
          title: "Productos físicos",
          text: "Los productos impresos se cotizan según tamaño, material y cantidad.",
        },
        {
          title: "Condiciones de locación",
          text: "Cambios de lugar, clima, horarios o logística pueden ajustar la propuesta final.",
        },
      ],
      portfolioTitle: "Portafolio de retratos y sesiones",
      closingText:
        "Será un gusto acompañar esta sesión y crear imágenes que se sientan auténticas y memorables.",
    };
  }

  if (kind === "school") {
    return {
      kind,
      eyebrow: "Fotografía escolar",
      coverTitle: "Servicios",
      coverSubtitle: "& propuesta institucional",
      helloText:
        "En Samora Estudio acompañamos instituciones, estudiantes y familias en la creación de recuerdos escolares con una entrega organizada, cuidada y profesional.",
      serviceTitle: "Grados",
      serviceIntro:
        "Esta propuesta se ajusta al número de estudiantes, tipo de evento, fotografías individuales o grupales, cartillas, impresiones y entregables solicitados.",
      quantityLabel: "Estudiantes / participantes",
      packageLabel: "Propuesta institucional",
      coverageTitle: "Registro escolar",
      coverageIntro:
        "Un servicio pensado para instituciones y grupos que necesitan una entrega ordenada, clara y profesional.",
      coverageItems: [
        "Fotografías individuales, grupales o de ceremonia según la solicitud.",
        "Registro de estudiantes, docentes, familias, detalles y momentos importantes.",
        "Organización por grupos, grados o referencias cuando aplica.",
        "Entrega digital o física según el paquete acordado.",
      ],
      deliverableTitle: "Entrega institucional",
      deliverableItems: [
        "Fotografías editadas en alta resolución.",
        "Entregables digitales, impresos, cartillas o paquetes escolares si aplican.",
        "Organización de material según institución, grado o grupo.",
      ],
      extras: [
        {
          title: "Logística",
          text: "Se recomienda definir cronograma, cantidad de estudiantes y espacios disponibles antes del servicio.",
        },
        {
          title: "Entrega",
          text: "La entrega puede organizarse por estudiante, grupo o institución según lo acordado.",
        },
        {
          title: "Productos impresos",
          text: "Cartillas, fotos impresas y marcos se cotizan según cantidad y formato.",
        },
        {
          title: "Coordinación",
          text: "La institución debe confirmar horarios, responsables y orden de grupos para la jornada.",
        },
      ],
      portfolioTitle: "Portafolio de fotografía escolar",
      closingText:
        "Será un gusto acompañar a la institución y entregar recuerdos organizados para estudiantes y familias.",
    };
  }

  if (kind === "digital") {
    return {
      kind,
      eyebrow: "Proyecto digital",
      coverTitle: "Servicios",
      coverSubtitle: "& propuesta web",
      helloText:
        "Gracias por considerar a Samora Estudio para tu proyecto digital. Preparamos esta propuesta para presentar el alcance, entregables y condiciones de una solución visual o tecnológica a medida.",
      serviceTitle: "Desarrollo digital",
      serviceIntro:
        "Esta propuesta se adapta al tipo de proyecto, funcionalidades, contenido, tiempos, integraciones y objetivos comerciales definidos con el cliente.",
      quantityLabel: "Alcance / módulos",
      packageLabel: "Propuesta digital",
      coverageTitle: "Alcance del proyecto",
      coverageIntro:
        "Un desarrollo pensado para presentar una marca, catálogo, tienda o sistema con estructura clara y experiencia cuidada.",
      coverageItems: [
        "Definición de estructura, secciones y experiencia de usuario.",
        "Diseño visual adaptado a la identidad del negocio o proyecto.",
        "Desarrollo de páginas, catálogo, tienda o funcionalidad acordada.",
        "Revisión y ajustes según el alcance aprobado.",
      ],
      deliverableTitle: "Entregables digitales",
      deliverableItems: [
        "Proyecto web o sistema según alcance aprobado.",
        "Diseño responsive para dispositivos principales.",
        "Publicación, configuración básica o acompañamiento según lo acordado.",
      ],
      extras: [
        {
          title: "Alcance",
          text: "Cambios de funcionalidades, integraciones o secciones pueden modificar tiempos y valor final.",
        },
        {
          title: "Contenido",
          text: "Textos, imágenes, productos o información del negocio deben ser suministrados o acordados previamente.",
        },
        {
          title: "Entrega",
          text: "Los tiempos de entrega dependen de la complejidad, revisión y disponibilidad de información.",
        },
        {
          title: "Soporte",
          text: "Acompañamiento posterior o mantenimiento puede cotizarse de forma independiente.",
        },
      ],
      portfolioTitle: "Portafolio de proyectos digitales",
      closingText:
        "Esperamos que esta propuesta sea el inicio de un proyecto digital claro, funcional y alineado con tu marca.",
    };
  }

  return {
    kind,
    eyebrow: "Propuesta personalizada",
    coverTitle: "Servicios",
    coverSubtitle: "& propuesta creativa",
    helloText:
      "Gracias por considerar a Samora Estudio. Preparamos esta propuesta para presentar de forma clara el servicio solicitado, sus entregables, condiciones y valor final.",
    serviceTitle: "Servicio",
    serviceIntro:
      "Esta propuesta se ajusta a los detalles definidos con el cliente: tipo de servicio, lugar, duración, entregables y necesidades específicas del proyecto.",
    quantityLabel: "Cantidad",
    packageLabel: "Propuesta personalizada",
    coverageTitle: "Alcance del servicio",
    coverageIntro:
      "Un acompañamiento visual adaptado a la necesidad específica del cliente o proyecto.",
    coverageItems: [
      "Acompañamiento visual según el servicio solicitado.",
      "Definición de entregables digitales o físicos.",
      "Edición y curaduría del material final.",
      "Entrega según condiciones aprobadas por ambas partes.",
    ],
    deliverableTitle: "Entrega",
    deliverableItems: [
      "Material digital editado.",
      "Entrega organizada para visualización o descarga.",
      "Productos físicos o adicionales si fueron incluidos.",
    ],
    extras: [
      {
        title: "Revisión previa",
        text: "Se recomienda revisar detalles y condiciones antes de confirmar el servicio.",
      },
      {
        title: "Entrega",
        text: "Los tiempos de entrega dependen del volumen de material, edición y productos adicionales.",
      },
      {
        title: "Ajustes",
        text: "Cualquier cambio de alcance debe acordarse antes de la fecha del servicio.",
      },
      {
        title: "Logística",
        text: "Lugar, duración y desplazamientos se validan antes de confirmar la propuesta.",
      },
    ],
    portfolioTitle: "Portafolio Samora Estudio",
    closingText:
      "Esperamos que esta propuesta cumpla con tus expectativas y estaremos atentos a cualquier ajuste que desees realizar.",
  };
}

function getFinalConditions(quote: ProposalQuote) {
  const custom = parseLines(quote.admin_notes);

  if (custom.length > 0) return custom;

  return [
    "La fecha se reserva únicamente cuando el cliente confirma la propuesta y realiza el abono acordado.",
    "Cambios de fecha, lugar, duración, cantidad de invitados o entregables pueden modificar el valor final.",
    "Las horas adicionales deben acordarse con anticipación y se cotizan de forma independiente.",
    "Los tiempos de entrega dependen del volumen de material, edición y productos físicos incluidos.",
  ];
}

function getDeliveryItems(quote: ProposalQuote, profile: ServiceProfile) {
  const items = [
    quote.digital_delivery ? "Entrega digital de material editado." : null,
    quote.printed_delivery ? "Entrega impresa según formato y cantidad acordada." : null,
    quote.special_deliverable
      ? "Álbum, marco, cartilla, photobook o entregable especial incluido en la propuesta."
      : null,
  ].filter(Boolean) as string[];

  return items.length > 0 ? items : profile.deliverableItems;
}

function getQuantityValue(quote: ProposalQuote, profile: ServiceProfile) {
  if (profile.kind === "wedding" || profile.kind === "social") {
    return quote.guest_count ? `${quote.guest_count} personas` : "Por confirmar";
  }

  if (profile.kind === "portrait") {
    if (quote.service_type === "mascotas") {
      return quote.quantity ? `${quote.quantity} mascota(s) / participante(s)` : "Por confirmar";
    }

    return quote.quantity ? `${quote.quantity} persona(s)` : "Por confirmar";
  }

  if (profile.kind === "commercial") {
    return quote.quantity ? `${quote.quantity} referencia(s)` : "Por confirmar";
  }

  if (profile.kind === "school") {
    return quote.quantity ? `${quote.quantity} estudiante(s)` : "Por confirmar";
  }

  return quote.quantity ? String(quote.quantity) : "Por confirmar";
}

function getInitials(name: string) {
  const words = name
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length === 0) return "S";
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase();

  return `${words[0].slice(0, 1)}${words[words.length - 1].slice(0, 1)}`.toUpperCase();
}

function CheckItem({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <li className={`flex gap-3 text-[13px] leading-[1.35] ${light ? "text-white/90" : "text-neutral-800"}`}>
      <span
        className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
          light ? "bg-white text-[var(--samora-teal)]" : "bg-[var(--samora-teal)] text-white"
        }`}
      >
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

function DataBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/80">
        {label}
      </p>
      <p className="mt-1 text-[13px] font-semibold leading-[1.25] text-white">
        {value}
      </p>
    </div>
  );
}

function NumberedCondition({ index, title, text }: { index: number; title: string; text: string }) {
  return (
    <div className="grid grid-cols-[76px_1fr] items-start gap-5 border-b border-[var(--samora-teal)]/25 pb-4 last:border-b-0 last:pb-0">
      <p className="proposal-display text-[58px] leading-none text-[var(--samora-teal)]">
        {String(index).padStart(2, "0")}
      </p>
      <div>
        <h3 className="text-[13px] font-black uppercase tracking-[0.12em] text-[var(--samora-teal)]">
          {title}
        </h3>
        <p className="mt-2 text-[12.5px] leading-[1.45] text-neutral-800">{text}</p>
      </div>
    </div>
  );
}

function PhotoBox({ className = "", rounded = "rounded-[1.6rem]" }: { className?: string; rounded?: string }) {
  return (
    <div className={`overflow-hidden bg-neutral-300 ${rounded} ${className}`}>
      <img src={HERO_IMAGE} alt="Referencia visual Samora" className="h-full w-full object-cover opacity-90" />
    </div>
  );
}

function TeamPhoto({
  src,
  className = "",
  imageClassName = "",
  objectPosition = "center center",
  imageStyle,
}: {
  src: string;
  className?: string;
  imageClassName?: string;
  objectPosition?: string;
  imageStyle?: CSSProperties;
}) {
  return (
    <div
      className={`overflow-hidden rounded-full border-[8px] border-white bg-neutral-200 shadow-[0_18px_42px_rgba(0,0,0,0.2)] ${className}`}
    >
      <img
        src={src}
        alt=""
        className={`h-full w-full object-cover ${imageClassName}`}
        style={{
          objectPosition,
          transformOrigin: "center center",
          ...imageStyle,
        }}
        aria-hidden="true"
      />
    </div>
  );
}

function DecorativeStar({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="h-px flex-1 bg-white/55" />
      <span className="mx-3 text-2xl leading-none text-white">✦</span>
      <div className="h-px flex-1 bg-white/55" />
    </div>
  );
}

export default async function QuoteProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data: quote, error } = await supabase
    .from("quote_requests")
    .select(
      `
      id,
      quote_code,
      customer_name,
      customer_phone,
      customer_email,
      customer_document,
      service_type,
      service_label,
      event_date,
      service_zone_label,
      service_location,
      duration_value,
      duration_unit,
      duration_hours,
      quantity,
      guest_count,
      digital_delivery,
      printed_delivery,
      special_deliverable,
      details,
      admin_notes,
      meeting_type,
      meeting_status,
      meeting_date,
      meeting_start_time,
      meeting_end_time,
      meeting_location,
      meeting_notes,
      confirmed_event_date,
      confirmed_start_time,
      confirmed_end_time,
      confirmed_location,
      schedule_notes,
      selected_package,
      final_price_cop,
      final_pdf_url,
      created_at
    `
    )
    .eq("id", id)
    .single();

  if (error || !quote) notFound();

  const typedQuote = quote as ProposalQuote;
  const serviceProfile = getServiceProfile(typedQuote);
  const clientName = getVisibleClientName(typedQuote);
  const initials = getInitials(clientName);
  const eventDate = getEventDate(typedQuote);
  const eventLocation = getEventLocation(typedQuote);
  const eventTime = getEventTime(typedQuote);
  const duration = getDurationLabel(typedQuote);
  const quantityValue = getQuantityValue(typedQuote, serviceProfile);
  const packageName = typedQuote.selected_package?.trim() || serviceProfile.packageLabel;
  const finalPrice = formatCOP(typedQuote.final_price_cop);
  const deliveryItems = getDeliveryItems(typedQuote, serviceProfile);
  const finalConditions = getFinalConditions(typedQuote);

  return (
    <>
      <div className="no-print">
        <Navbar />
      </div>

      <main className="min-h-screen bg-neutral-950 py-24 text-white print:bg-white print:py-0">
        <div className="no-print mx-auto mb-8 flex max-w-5xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/35">
              Vista de propuesta
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
              {clientName}
            </h1>
            <p className="mt-2 text-sm text-white/45">
              Revisa la propuesta y usa imprimir para guardarla como PDF.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/cotizaciones"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm text-white/70 transition hover:border-white/35 hover:bg-white hover:text-black"
            >
              Volver a cotizaciones
            </Link>
            <PrintProposalButton />
          </div>
        </div>

        <div className="proposal-root mx-auto grid max-w-5xl gap-8 px-4 print:block print:max-w-none print:px-0">
          {/* 01 - Portada principal */}
          <section className="proposal-sheet bg-[var(--samora-cream)] text-neutral-950">
            <div className="absolute inset-x-0 bottom-0 h-[29%] bg-[var(--samora-teal)]" />
            <div className="absolute left-1/2 top-12 h-20 w-[320px] -translate-x-1/2 rounded-[50%] border-t border-neutral-500/40" />
            <div className="relative z-10 flex h-full flex-col items-center px-12 pt-16 text-center">
              <p className="proposal-label text-neutral-700">{serviceProfile.eyebrow}</p>
              <h2 className="proposal-display mt-5 text-[108px] uppercase leading-[0.78] tracking-[-0.07em] text-neutral-900">
                {serviceProfile.coverTitle}
              </h2>
              <p className="proposal-script -mt-1 text-[50px] text-neutral-800">
                {serviceProfile.coverSubtitle}
              </p>

              <div className="relative mt-9 h-[330px] w-[610px] max-w-full overflow-hidden border-[10px] border-white bg-neutral-200 shadow-xl">
                <PhotoBox className="h-full w-full" rounded="rounded-none" />
              </div>
            </div>
          </section>

          {/* 02 - Portada alternativa tipo collage */}
          <section className="proposal-sheet bg-[var(--samora-cream)] text-neutral-950">
            <div className="absolute -left-16 top-0 h-24 w-[420px] rotate-[-10deg] rounded-full bg-[var(--samora-teal)]/25 blur-sm" />
            <div className="absolute -right-10 bottom-8 h-24 w-[420px] rotate-[-12deg] rounded-full bg-[var(--samora-teal)]/25 blur-sm" />
            <div className="relative z-10 flex h-full flex-col items-center px-12 pt-16 text-center">
              <p className="proposal-label text-neutral-700">{serviceProfile.eyebrow}</p>
              <h2 className="proposal-display mt-5 text-[96px] uppercase leading-[0.78] tracking-[-0.07em] text-neutral-900">
                Servicios
              </h2>
              <p className="proposal-script -mt-1 text-[50px] text-neutral-800">
                & propuesta personalizada
              </p>

              <div className="relative mt-10 flex h-[310px] items-end justify-center gap-0">
                <PhotoBox className="h-[250px] w-[180px] -rotate-2 shadow-xl" />
                <PhotoBox className="z-10 h-[300px] w-[210px] shadow-2xl" />
                <PhotoBox className="h-[250px] w-[180px] rotate-2 shadow-xl" />
              </div>
            </div>
          </section>

          {/* 03 - Hola */}
          <section className="proposal-sheet overflow-hidden bg-[var(--samora-teal)] text-white">
            <div className="grid h-full grid-rows-[40%_1fr]">
              <PhotoBox className="h-full w-full" rounded="rounded-none" />
              <div className="relative p-12">
                <p className="proposal-display text-[82px] leading-none text-white">
                  Hola!
                </p>
                <p className="mt-5 max-w-[680px] text-[15px] leading-[1.55] text-white/90">
                  {serviceProfile.helloText} Gracias por confiar en nosotros para ser parte de un momento significativo y permitirnos presentar una propuesta pensada para ustedes.
                </p>
                <div className="mt-8">
                  <p className="proposal-script text-[56px] leading-none text-white">
                    {TEAM_SIGNATURE}
                  </p>
                  <p className="mt-1 text-[14px] uppercase tracking-[0.12em] text-white/80">
                    {TEAM_SIGNATURE_SUBTITLE}
                  </p>
                </div>
                <DecorativeStar className="absolute inset-x-0 bottom-9 px-8" />
              </div>
            </div>
          </section>

          {/* 04 - Nosotros */}
          <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
            <div className="absolute inset-y-0 left-0 w-[27%] bg-[var(--samora-teal)]" />

            <div className="relative z-10 ml-[27%] px-10 pt-12">
              <h2 className="proposal-display text-[86px] leading-none text-neutral-900">
                Nosotros
              </h2>
              <p className="mt-6 max-w-[535px] text-[17.2px] leading-[1.42] tracking-[0.01em] text-neutral-900">
                Somos fotógrafos especializados en eventos sociales, con 5 años de experiencia capturando momentos que trascienden el tiempo. Nos apasiona registrar conexiones genuinas y momentos reales, esos instantes espontáneos que cuentan historias de manera auténtica. A lo largo de nuestra trayectoria hemos tenido el privilegio de documentar historias de amor con un enfoque cuidadoso en la preservación de recuerdos que perduren. Sabemos que los momentos pasan, pero las fotografías permanecen, y nuestro objetivo es que esas imágenes se conviertan en recuerdos para toda la vida.
              </p>
            </div>

            <div className="absolute bottom-[98px] left-[56px] z-20 flex items-end">
              <TeamPhoto
                src={TEAM_OWNER_1_IMAGE}
                className="h-[225px] w-[225px]"
                imageClassName="object-[center_center]"
              />
              <TeamPhoto
                src={TEAM_OWNER_2_IMAGE}
                className="-ml-[20px] h-[218px] w-[218px]"
                objectPosition="center center"
                imageStyle={{
                  transform: "translateY(-10px) scale(1.16)",
                }}
              />
            </div>

            <div className="absolute bottom-[66px] left-[252px] z-10 h-px w-[360px] bg-neutral-900/10" />
          </section>

          {/* 05 - Servicios / datos */}
          <section className="proposal-sheet overflow-hidden bg-[var(--samora-teal)] text-white">
            <div className="grid h-full grid-cols-[42%_1fr]">
              <div className="grid h-full grid-rows-3 gap-0">
                <PhotoBox className="h-full w-full" rounded="rounded-none" />
                <PhotoBox className="h-full w-full" rounded="rounded-none" />
                <PhotoBox className="h-full w-full" rounded="rounded-none" />
              </div>

              <div className="p-10">
                <h2 className="proposal-display text-[70px] leading-none text-white">
                  {serviceProfile.serviceTitle}
                </h2>
                <p className="mt-4 text-[13.5px] leading-[1.45] text-white/88">
                  Estimado/a <strong>{clientName}</strong>, nos complace presentar esta propuesta para <strong>{typedQuote.service_label}</strong>. {serviceProfile.serviceIntro}
                </p>
                <p className="proposal-script mt-7 text-[38px] text-[#e6d986]">
                  {clientName}
                </p>

                <div className="mt-6 grid gap-3.5">
                  <DataBlock label="Fecha del servicio" value={formatDateOnly(eventDate)} />
                  <DataBlock label="Lugar" value={eventLocation} />
                  <DataBlock label="Hora de inicio" value={eventTime} />
                  <DataBlock label="Duración" value={duration} />
                  <DataBlock label={serviceProfile.quantityLabel} value={quantityValue} />
                </div>
              </div>
            </div>
          </section>

          {/* 06 - Propuesta / alcance */}
          <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
            <div className="grid h-full grid-cols-[43%_1fr]">
              <PhotoBox className="h-full w-full" rounded="rounded-none" />
              <div className="p-10">
                <p className="text-[16px] font-black uppercase tracking-[0.12em] text-[var(--samora-teal)]">
                  Propuesta
                </p>
                <h2 className="proposal-display mt-1 text-[70px] leading-[0.88] text-neutral-900">
                  {packageName}
                </h2>
                <p className="mt-4 text-[13.5px] leading-[1.45] text-neutral-800">
                  {serviceProfile.coverageIntro}
                </p>

                <div className="mt-5 bg-[var(--samora-card)] p-6">
                  <h3 className="proposal-display text-[36px] leading-none text-[var(--samora-teal)]">
                    {serviceProfile.coverageTitle}
                  </h3>
                  <ul className="mt-5 grid gap-3.5">
                    {serviceProfile.coverageItems.map((item) => (
                      <CheckItem key={item}>{item}</CheckItem>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 07 - Entregables y costo */}
          <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
            <div className="grid h-full grid-cols-[56%_1fr]">
              <div className="p-10">
                <div className="bg-[var(--samora-card)] p-6">
                  <h2 className="proposal-display text-[42px] leading-none text-[var(--samora-teal)]">
                    {serviceProfile.deliverableTitle}
                  </h2>
                  <ul className="mt-5 grid gap-3.5">
                    {deliveryItems.map((item) => (
                      <CheckItem key={item}>{item}</CheckItem>
                    ))}
                  </ul>

                  <h3 className="proposal-display mt-8 text-[36px] leading-none text-[var(--samora-teal)]">
                    Recuerdo físico
                  </h3>
                  <ul className="mt-4 grid gap-3.5">
                    <CheckItem>
                      Productos impresos, marcos, photobook o cartilla se entregan según lo aprobado en la propuesta.
                    </CheckItem>
                    <CheckItem>Duración de cubrimiento: {duration}.</CheckItem>
                  </ul>

                  <p className="mt-7 text-[15px] font-black text-[var(--samora-teal)]">
                    Costo
                  </p>
                  <p className="proposal-display mt-1 text-[58px] leading-none text-neutral-900">
                    {finalPrice}
                  </p>
                </div>
              </div>
              <div className="grid h-full grid-rows-2 gap-0">
                <PhotoBox className="h-full w-full" rounded="rounded-none" />
                <PhotoBox className="h-full w-full" rounded="rounded-none" />
              </div>
            </div>
          </section>

          {/* 08 - Condiciones y servicios extra */}
          <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
            <div className="grid h-full grid-cols-[36%_1fr]">
              <PhotoBox className="h-full w-full" rounded="rounded-none" />
              <div className="p-10">
                <p className="text-[18px] font-black uppercase tracking-[0.08em] text-[var(--samora-teal)]">
                  Condiciones y
                </p>
                <h2 className="proposal-display text-[66px] leading-[0.82] text-neutral-900">
                  Servicios
                  <br />
                  Extra
                </h2>

                <div className="mt-6 grid gap-4">
                  {serviceProfile.extras.slice(0, 4).map((item, index) => (
                    <NumberedCondition key={item.title} index={index + 1} title={item.title} text={item.text} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 09 - Servicios adicionales / detalles */}
          <section className="proposal-sheet overflow-hidden bg-[var(--samora-teal)] text-white">
            <div className="grid h-full grid-rows-[45%_1fr]">
              <PhotoBox className="h-full w-full" rounded="rounded-none" />
              <div className="grid grid-cols-2 gap-10 p-10">
                <div>
                  <p className="proposal-display text-[54px] leading-none text-[#e8dd9a]">05</p>
                  <h2 className="mt-2 text-[16px] font-black uppercase tracking-[0.1em] text-[#e8dd9a]">
                    Servicio adicional
                  </h2>
                  <p className="mt-4 text-[13px] leading-[1.55] text-white/85">
                    Se pueden acordar entregables adicionales, productos impresos, ampliaciones, sesiones complementarias o ajustes de alcance según la necesidad del cliente.
                  </p>
                </div>
                <div>
                  <p className="proposal-display text-[54px] leading-none text-[#e8dd9a]">06</p>
                  <h2 className="mt-2 text-[16px] font-black uppercase tracking-[0.1em] text-[#e8dd9a]">
                    Detalles personalizados
                  </h2>
                  <p className="mt-4 whitespace-pre-wrap text-[13px] leading-[1.55] text-white/85">
                    {typedQuote.details ||
                      "Los detalles finales se revisan con el cliente antes de confirmar la propuesta, el valor final y la agenda del servicio."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 10 - Confirmación / cierre */}
          <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
            <div className="grid h-full grid-rows-[24%_1fr]">
              <PhotoBox className="h-full w-full" rounded="rounded-none" />
              <div className="grid grid-cols-[1fr_34%] gap-7 px-9 py-7">
                <div>
                  <div className="grid grid-cols-[62px_1fr] gap-4 border-b border-neutral-300 pb-3.5">
                    <p className="proposal-display text-[54px] leading-none text-[var(--samora-teal)]">07</p>
                    <div>
                      <h2 className="text-[14px] font-black uppercase tracking-[0.1em] text-[var(--samora-teal)]">
                        Confirmación de propuesta
                      </h2>
                      <p className="mt-1.5 text-[12px] leading-[1.36] text-neutral-800">
                        Esta propuesta resume los detalles revisados previamente con el cliente. Una vez aprobada, se confirma la fecha del servicio y se coordina el abono correspondiente para reservar la agenda.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 border-b border-neutral-800 pb-2.5">
                    <h3 className="text-[15px] font-black uppercase tracking-[0.08em] text-neutral-900">
                      Cierre y aprobación del servicio
                    </h3>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-[14px] font-black uppercase tracking-[0.1em] text-[var(--samora-teal)]">
                      Siguientes pasos
                    </h3>
                    <p className="mt-2.5 text-[11.5px] leading-[1.42] text-neutral-700">
                      Después de la aprobación, el equipo de Samora Estudio confirmará la agenda final, condiciones acordadas, abono de reserva y próximos pasos para el desarrollo del servicio.
                    </p>
                  </div>

                  <div className="mt-5">
                    <h3 className="text-[13px] font-black uppercase tracking-[0.12em] text-neutral-800">
                      Condiciones finales
                    </h3>
                    <ul className="mt-2 grid gap-1.5">
                      {finalConditions.slice(0, 4).map((item) => (
                        <li key={item} className="text-[10.5px] leading-[1.32] text-neutral-700">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="mt-4 text-[11.5px] leading-[1.42] text-neutral-700">
                    {serviceProfile.closingText}
                  </p>

                  <p className="mt-3 text-[11.5px] leading-[1.35] text-neutral-700">Atentamente,</p>
                  <p className="proposal-script mt-1 text-[24px] text-neutral-900">
                    Equipo de Samora Estudio Creativo
                  </p>
                  <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-neutral-500">
                    Código: {typedQuote.quote_code}
                  </p>
                </div>

                <div className="relative self-start">
                  <PhotoBox className="h-[245px] w-full" rounded="rounded-none" />
                  <div className="absolute -bottom-4 left-1/2 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--samora-teal)] text-xl font-black text-white shadow-xl">
                    {initials}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style>{`
        :root {
          --samora-teal: ${SAMORA_TEAL};
          --samora-teal-dark: ${SAMORA_TEAL_DARK};
          --samora-cream: ${SAMORA_CREAM};
          --samora-card: ${SAMORA_CARD};
        }

        .proposal-root {
          font-family: "Gotham Book", "Quicksand", "Montserrat", Arial, sans-serif;
        }

        .proposal-display {
          font-family: "Aurora", "Bodoni 72", "Didot", "Playfair Display", Georgia, serif;
          letter-spacing: -0.055em;
          font-weight: 500;
        }

        .proposal-script {
          font-family: "EyesomeScript", "Angeletta-Regular", "Brush Script MT", "Segoe Script", cursive;
          line-height: 1;
        }

        .proposal-label {
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.34em;
          text-transform: uppercase;
        }

        .proposal-sheet {
          position: relative;
          aspect-ratio: 1 / 1;
          min-height: 920px;
          width: 100%;
          overflow: hidden;
          border-radius: 0;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
        }

        .proposal-root,
        .proposal-sheet,
        .proposal-sheet * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        @media print {
          @page {
            size: 210mm 210mm;
            margin: 0;
          }

          html,
          body {
            width: 210mm !important;
            min-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          main {
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print {
            display: none !important;
          }

          .proposal-root {
            display: block !important;
          }

          .proposal-sheet {
            width: 210mm !important;
            height: 210mm !important;
            min-height: 210mm !important;
            max-height: 210mm !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
            break-inside: avoid;
            page-break-after: always;
            break-after: page;
          }

          .proposal-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>
    </>
  );
}
