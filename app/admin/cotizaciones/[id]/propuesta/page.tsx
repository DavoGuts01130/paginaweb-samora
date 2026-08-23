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

type GeneralProfile = {
  kind: TemplateKind;
  eyebrow: string;
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
  closingText: string;
};

const SAMORA_TEAL = "#285564";
const SAMORA_TEAL_DARK = "#214957";
const SAMORA_CREAM = "#f4f1eb";
const SAMORA_CARD = "#e7e7e2";
const SAMORA_GOLD = "#d8cd84";
const HERO_IMAGE = "/hero.png";
const TEAM_OWNER_1_IMAGE = "/samora-team/owner-1.png";
const TEAM_OWNER_2_IMAGE = "/samora-team/owner-2.png";
const TEAM_SIGNATURE = "Jilly&Samantha";
const TEAM_SIGNATURE_SUBTITLE = "Fotografía & diseño";
const WEDDING_PATH = "/proposals/wedding";
const WEDDING_PORTFOLIO_PATH = "/portafolio/eventos-especiales";

function getPublicSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://samoraestudiocreativo.com"
  ).replace(/\/$/, "");
}

function getWeddingPortfolioUrl() {
  return `${getPublicSiteUrl()}${WEDDING_PORTFOLIO_PATH}`;
}


const weddingImages = {
  cover1: `${WEDDING_PATH}/wedding-cover-1.jpg`,
  cover2: `${WEDDING_PATH}/wedding-cover-2.png`,
  hello: `${WEDDING_PATH}/wedding-hello.jpg`,
  services1: `${WEDDING_PATH}/wedding-services-1.jpg`,
  services2: `${WEDDING_PATH}/wedding-services-2.jpg`,
  services3: `${WEDDING_PATH}/wedding-services-3.jpg`,
  memoria1: `${WEDDING_PATH}/wedding-package-memoria-1.jpg`,
  memoria2: `${WEDDING_PATH}/wedding-package-memoria-2.jpg`,
  memoria3: `${WEDDING_PATH}/wedding-package-memoria-3.jpg`,
  memoria4: `${WEDDING_PATH}/wedding-package-memoria-4.jpg`,
  ideal1: `${WEDDING_PATH}/wedding-package-ideal-1.jpg`,
  ideal2: `${WEDDING_PATH}/wedding-package-ideal-2.jpg`,
  ideal3: `${WEDDING_PATH}/wedding-package-ideal-3.jpg`,
  ideal4: `${WEDDING_PATH}/wedding-package-ideal-4.jpg`,
  esencial1: `${WEDDING_PATH}/wedding-package-esencial-1.jpg`,
  conditions: `${WEDDING_PATH}/wedding-conditions.jpg`,
  extra: `${WEDDING_PATH}/wedding-extra.jpg`,
  closing1: `${WEDDING_PATH}/wedding-closing-1.jpg`,
  closing2: `${WEDDING_PATH}/wedding-closing-2.jpg`,
};

const meetingTypeLabels: Record<string, string> = {
  por_definir: "Por definir",
  virtual: "Virtual",
  presencial: "Presencial",
  whatsapp: "WhatsApp",
};

const meetingStatusLabels: Record<string, string> = {
  pendiente_programar: "Pendiente por programar",
  programada: "Programada",
  realizada: "Realizada",
  no_requerida: "No requerida",
  cancelada: "Cancelada",
};

const weddingPackages = [
  {
    number: "PAQUETE 1",
    name: "Memoria",
    intro:
      "Un plan pensado para parejas que desean un recuerdo completo, profundo y detallado de su boda. Este paquete combina la magia del gran día con una sesión previa que captura la esencia de su historia, asegurando un registro visual lleno de emoción, estética y significado.",
    price: "$1´600.000",
    coverage: [
      "PreCeremonia · Momentos antes de la boda del novio y de la novia.",
      "Cobertura fotográfica y videográfica de la ceremonia religiosa o simbólica.",
      "Sesión fotográfica posterior a la ceremonia.",
      "Recepción · Entrada de los novios, brindis, vals, fotografías familiares, invitados, detalles de decoración y momentos espontáneos.",
      "Registro aéreo y terrestre con drone y registro audiovisual desde tierra para complementar la historia de la celebración.",
    ],
    deliverables: [
      "Aproximadamente 300 fotos digitales editadas en alta resolución.",
      "Álbum digital con selección de las mejores fotografías mediante una plataforma online privada.",
      "El álbum permitirá visualizar, descargar y compartir las fotografías desde cualquier dispositivo.",
      "Video de la boda de aproximadamente 4 a 5 minutos + clip tipo reel de 2 a 1 minutos con momentos representativos.",
    ],
    physical: [
      "Photobook en pasta dura, tamaño base 15 × 20 cm, hasta 5 hojas, diseño y selección de fotografías incluido.",
      "Fotografía enmarcada 40 × 50 cm.",
      "Opciones de personalización con costo adicional según tamaño, número de hojas o referencia de photobook.",
      "Duración de cubrimiento: 5 a 6 horas.",
    ],
  },
  {
    number: "PAQUETE 2",
    name: "Ideal",
    intro:
      "Este paquete es ideal para quienes desean una cobertura más extensa, incluyendo una sesión fotográfica especial después de la ceremonia. Garantiza un registro detallado y vibrante de cada detalle de tu celebración.",
    price: "$1´450.000",
    coverage: [
      "Cobertura fotográfica y videográfica de la ceremonia religiosa o simbólica.",
      "Sesión fotográfica posterior a la ceremonia.",
      "Recepción · Momentos importantes de la celebración, entrada de los novios, brindis, vals, fotografías familiares, invitados, detalles de decoración y momentos espontáneos.",
      "Registro aéreo y terrestre con drone y registro audiovisual desde tierra para complementar la historia de la celebración.",
    ],
    deliverables: [
      "Aproximadamente 200 fotos digitales editadas en alta resolución.",
      "Álbum digital con selección de las mejores fotografías mediante una plataforma online privada.",
      "Video de la boda de aproximadamente 3 a 4 minutos, con los momentos más representativos de la celebración.",
    ],
    physical: [
      "Fotobook en pasta dura 15 × 20 cm, con hasta 5 hojas.",
      "Fotografía enmarcada 30 × 40 cm.",
      "Duración de cubrimiento: 4 a 5 horas.",
    ],
  },
  {
    number: "PAQUETE 3",
    name: "Esencial",
    intro:
      "Una cobertura pensada para conservar los momentos esenciales de tu boda con calidad y detalle.",
    price: "$1´250.000",
    coverage: [
      "Cobertura fotográfica y videográfica de la ceremonia religiosa o simbólica.",
      "Recepción · Momentos importantes de la celebración.",
      "Registro aéreo y terrestre con drone y registro audiovisual desde tierra para complementar la historia de la celebración.",
    ],
    deliverables: [
      "Aproximadamente 200 fotos digitales editadas en alta resolución.",
      "Álbum digital con selección de las mejores fotografías mediante una plataforma online privada.",
      "Video de la boda de aproximadamente 1 a 2 minutos, con los momentos más representativos de la celebración.",
    ],
    physical: [
      "MiniBook en pasta dura 10 × 15 cm, con hasta 5 hojas.",
      "Fotografía enmarcada 20 × 30 cm.",
      "Duración de cubrimiento: 2 a 3 horas.",
    ],
  },
];

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

  return "Por confirmar";
}

function getVisibleClientName(quote: ProposalQuote) {
  return quote.customer_name?.trim() || "Cliente Samora";
}

function getFirstNamePair(value: string) {
  if (value.includes("&")) {
    return value
      .split("&")
      .map((item) => item.trim().split(/\s+/)[0])
      .filter(Boolean)
      .join("&");
  }

  const clean = value.trim();
  return clean || "Samora";
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

function normalizeForSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function extractDetailValue(text: string | null | undefined, labels: string[]) {
  const lines = parseLines(text);
  const normalizedLabels = labels.map(normalizeForSearch);

  for (const line of lines) {
    const normalizedLine = normalizeForSearch(line);
    const matched = normalizedLabels.find((label) => normalizedLine.startsWith(label));

    if (matched) {
      const rawIndex = line.indexOf(":");
      if (rawIndex >= 0) return line.slice(rawIndex + 1).trim();
      return line;
    }
  }

  return "";
}

function getWeddingCeremonyLocation(quote: ProposalQuote) {
  return (
    extractDetailValue(quote.details, ["lugar de la ceremonia", "ceremonia"]) ||
    extractDetailValue(quote.admin_notes, ["lugar de la ceremonia", "ceremonia"]) ||
    getEventLocation(quote)
  );
}

function getWeddingReceptionLocation(quote: ProposalQuote) {
  return (
    extractDetailValue(quote.details, ["lugar recepción", "lugar recepcion", "recepción", "recepcion"]) ||
    extractDetailValue(quote.admin_notes, ["lugar recepción", "lugar recepcion", "recepción", "recepcion"]) ||
    "Por confirmar"
  );
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

function getGeneralProfile(quote: ProposalQuote): GeneralProfile {
  const kind = getTemplateKind(quote.service_type);

  if (kind === "social") {
    return {
      kind,
      eyebrow: "Fotografía de eventos sociales",
      coverSubtitle: "& guía de servicio",
      helloText:
        "Gracias por considerar a Samora Estudio para registrar una celebración tan especial. Nos enfocamos en capturar momentos reales, detalles significativos y recuerdos que puedan conservarse con una presentación cuidada y atemporal.",
      serviceTitle: "Celebración",
      serviceIntro:
        "Esta guía presenta el servicio solicitado, la información inicial del evento y los siguientes pasos para coordinar la cobertura.",
      quantityLabel: "Número de invitados",
      packageLabel: "Propuesta de celebración",
      coverageTitle: "Cobertura del evento",
      coverageIntro:
        "Un acompañamiento visual para conservar los momentos más importantes de la celebración con sensibilidad y profesionalismo.",
      coverageItems: [
        "Registro de momentos principales de la celebración.",
        "Fotografías familiares, invitados, decoración y detalles especiales.",
        "Sesión del protagonista, familia o grupo principal según el evento.",
        "Acompañamiento durante el tiempo de cobertura acordado.",
      ],
      deliverableTitle: "Entrega",
      deliverableItems: [
        "Fotografías digitales editadas en alta resolución.",
        "Selección de mejores fotografías para entrega digital.",
        "Impresiones, marcos, photobook o recuerdos físicos si fueron solicitados.",
      ],
      extras: [
        { title: "Agenda del evento", text: "Se recomienda definir horarios, momentos clave y logística antes de la celebración." },
        { title: "Invitados", text: "La cantidad de invitados permite dimensionar el tiempo de cobertura y los entregables." },
        { title: "Hora adicional", text: "Las horas extra se acuerdan con anticipación y se cotizan según la necesidad del evento." },
        { title: "Entrega", text: "Los tiempos de entrega dependen del volumen de fotografías, edición y productos físicos." },
      ],
      closingText:
        "Será un gusto acompañar esta celebración y ayudar a conservar sus momentos más importantes.",
    };
  }

  if (kind === "commercial") {
    return {
      kind,
      eyebrow: "Fotografía comercial",
      coverSubtitle: "& guía para marca",
      helloText:
        "En Samora Estudio creamos imágenes pensadas para comunicar el valor de una marca, producto, espacio o experiencia. Nuestro enfoque combina estética, claridad visual y contenido útil para catálogos, redes sociales, menús o plataformas digitales.",
      serviceTitle: "Marca y producto",
      serviceIntro:
        "Esta guía se adapta al número de productos, platos, bebidas, espacios o fotografías requeridas, así como al uso final de las imágenes.",
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
        { title: "Preparación", text: "Es importante definir referencias visuales, lista de productos, locación y estilo antes de la sesión." },
        { title: "Uso de imágenes", text: "La propuesta puede adaptarse a redes, catálogo, carta, web o campañas." },
        { title: "Producción", text: "Utilería, ambientación o dirección adicional pueden acordarse según la necesidad de la marca." },
        { title: "Entrega", text: "Los archivos se entregan organizados según referencias, productos o categorías acordadas." },
      ],
      closingText:
        "Esperamos que esta guía ayude a fortalecer la presencia visual de tu marca o proyecto.",
    };
  }

  if (kind === "portrait") {
    return {
      kind,
      eyebrow: "Sesión fotográfica",
      coverSubtitle: "& guía personalizada",
      helloText:
        "Gracias por confiar en Samora Estudio para crear imágenes personales, familiares o artísticas con intención. Buscamos que cada sesión se sienta natural, cuidada y conectada con la historia o personalidad de quien aparece frente a la cámara.",
      serviceTitle: "Sesión",
      serviceIntro:
        "Esta guía se adapta al tipo de sesión, número de personas o mascotas, locación, duración, cambios de vestuario y entregables digitales o impresos solicitados.",
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
        { title: "Preparación", text: "Se pueden definir referencias, vestuario, locación y estilo antes de la fecha acordada." },
        { title: "Selección", text: "La selección de fotografías finales se acuerda según el paquete o propuesta aprobada." },
        { title: "Productos físicos", text: "Los productos impresos se cotizan según tamaño, material y cantidad." },
        { title: "Locación", text: "Cambios de lugar, clima, horarios o logística pueden ajustar la propuesta final." },
      ],
      closingText:
        "Será un gusto acompañar esta sesión y crear imágenes que se sientan auténticas y memorables.",
    };
  }

  if (kind === "school") {
    return {
      kind,
      eyebrow: "Fotografía escolar",
      coverSubtitle: "& guía institucional",
      helloText:
        "En Samora Estudio acompañamos instituciones, estudiantes y familias en la creación de recuerdos escolares con una entrega organizada, cuidada y profesional.",
      serviceTitle: "Grados",
      serviceIntro:
        "Esta guía se ajusta al número de estudiantes, tipo de evento, fotografías individuales o grupales, cartillas, impresiones y entregables solicitados.",
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
        { title: "Logística", text: "Se recomienda definir cronograma, cantidad de estudiantes y espacios disponibles antes del servicio." },
        { title: "Entrega", text: "La entrega puede organizarse por estudiante, grupo o institución según lo acordado." },
        { title: "Productos impresos", text: "Cartillas, fotos impresas y marcos se cotizan según cantidad y formato." },
        { title: "Coordinación", text: "La institución debe confirmar horarios, responsables y orden de grupos para la jornada." },
      ],
      closingText:
        "Será un gusto acompañar a la institución y entregar recuerdos organizados para estudiantes y familias.",
    };
  }

  if (kind === "digital") {
    return {
      kind,
      eyebrow: "Proyecto digital",
      coverSubtitle: "& guía web",
      helloText:
        "Gracias por considerar a Samora Estudio para tu proyecto digital. Preparamos esta guía para presentar el alcance inicial, entregables y condiciones de una solución visual o tecnológica a medida.",
      serviceTitle: "Desarrollo digital",
      serviceIntro:
        "Esta guía se adapta al tipo de proyecto, funcionalidades, contenido, tiempos, integraciones y objetivos comerciales definidos con el cliente.",
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
        { title: "Alcance", text: "Cambios de funcionalidades, integraciones o secciones pueden modificar tiempos y valor final." },
        { title: "Contenido", text: "Textos, imágenes, productos o información del negocio deben ser suministrados o acordados previamente." },
        { title: "Entrega", text: "Los tiempos de entrega dependen de la complejidad, revisión y disponibilidad de información." },
        { title: "Soporte", text: "Acompañamiento posterior o mantenimiento puede cotizarse de forma independiente." },
      ],
      closingText:
        "Esperamos que esta guía sea el inicio de un proyecto digital claro, funcional y alineado con tu marca.",
    };
  }

  return {
    kind,
    eyebrow: "Propuesta personalizada",
    coverSubtitle: "& guía creativa",
    helloText:
      "Gracias por considerar a Samora Estudio. Preparamos esta guía para presentar de forma clara el servicio solicitado, sus entregables, condiciones y próximos pasos.",
    serviceTitle: "Servicio",
    serviceIntro:
      "Esta guía se ajusta a los detalles definidos con el cliente: tipo de servicio, lugar, duración, entregables y necesidades específicas del proyecto.",
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
      { title: "Coordinación", text: "Se recomienda revisar detalles y condiciones antes de confirmar el servicio." },
      { title: "Entrega", text: "Los tiempos de entrega dependen del volumen de material, edición y productos adicionales." },
      { title: "Ajustes", text: "Cualquier cambio de alcance debe acordarse antes de la fecha del servicio." },
      { title: "Logística", text: "Lugar, duración y desplazamientos se validan antes de confirmar la propuesta." },
    ],
    closingText:
      "Esperamos que esta guía cumpla con tus expectativas y estaremos atentos a cualquier ajuste que desees realizar.",
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

function getDeliveryItems(quote: ProposalQuote, profile: GeneralProfile) {
  const items = [
    quote.digital_delivery ? "Entrega digital de material editado." : null,
    quote.printed_delivery ? "Entrega impresa según formato y cantidad acordada." : null,
    quote.special_deliverable
      ? "Álbum, marco, cartilla, photobook o entregable especial incluido en la propuesta."
      : null,
  ].filter(Boolean) as string[];

  return items.length > 0 ? items : profile.deliverableItems;
}

function getQuantityValue(quote: ProposalQuote, profile: GeneralProfile) {
  if (profile.kind === "social") {
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

function getMeetingText(quote: ProposalQuote) {
  const type = meetingTypeLabels[quote.meeting_type ?? "por_definir"] ?? "Por definir";
  const status = meetingStatusLabels[quote.meeting_status ?? "pendiente_programar"] ?? "Pendiente por programar";
  const date = quote.meeting_date ? formatDateOnly(quote.meeting_date) : "Por programar";
  const time = quote.meeting_start_time
    ? quote.meeting_end_time
      ? `${formatTime(quote.meeting_start_time)} - ${formatTime(quote.meeting_end_time)}`
      : formatTime(quote.meeting_start_time)
    : "Por programar";
  const location = quote.meeting_location?.trim() || "Por definir";

  return { type, status, date, time, location };
}

function CheckItem({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <li className={`flex gap-3 text-[14.5px] leading-[1.38] ${light ? "text-white/90" : "text-neutral-800"}`}>
      <span
        className={`mt-0.5 flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${light ? "bg-white text-[var(--samora-teal)]" : "bg-[var(--samora-teal)] text-white"
          }`}
      >
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

function WeddingFeatureItem({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <li className="flex gap-3 text-[15.5px] leading-[1.34] text-neutral-800">
      <span className="mt-0.5 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full bg-[var(--samora-teal)] text-[11px] font-bold text-white">
        ✓
      </span>

      <span>
        <strong className="font-black">{title}</strong>
        {children}
      </span>
    </li>
  );
}

function WeddingRichCheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3 text-[15.5px] leading-[1.28] text-neutral-800">
      <span className="mt-0.5 flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full bg-[var(--samora-teal)] text-[11px] font-bold text-white">
        ✓
      </span>

      <span>{children}</span>
    </li>
  );
}

function DataBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11.5px] font-black uppercase tracking-[0.14em] text-white/80">
        {label}
      </p>
      <p className="mt-1.5 text-[15px] font-semibold leading-[1.28] text-white">
        {value}
      </p>
    </div>
  );
}


function WeddingDataLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[17px] font-black leading-tight text-[var(--samora-gold)]">
        {label}
      </p>

      <p className="mt-0.5 text-[17px] font-medium leading-tight text-white">
        {value}
      </p>
    </div>
  );
}

function NumberedCondition({ index, title, text }: { index: number; title: string; text: string }) {
  return (
    <div className="grid grid-cols-[84px_1fr] items-start gap-5 border-b border-[var(--samora-teal)]/25 pb-5 last:border-b-0 last:pb-0">
      <p className="proposal-display text-[64px] leading-none text-[var(--samora-teal)]">
        {String(index).padStart(2, "0")}
      </p>
      <div>
        <h3 className="text-[13.5px] font-black uppercase tracking-[0.11em] text-[var(--samora-teal)]">
          {title}
        </h3>
        <p className="mt-2 text-[13.2px] leading-[1.45] text-neutral-800">{text}</p>
      </div>
    </div>
  );
}

function ImageBox({
  src,
  className = "",
  rounded = "rounded-none",
  objectPosition = "center center",
  alt = "Referencia visual Samora",
  imageStyle,
  fit = "cover",
}: {
  src: string;
  className?: string;
  rounded?: string;
  objectPosition?: string;
  alt?: string;
  imageStyle?: CSSProperties;
  fit?: "cover" | "contain";
}) {
  return (
    <div className={`overflow-hidden bg-neutral-300 ${rounded} ${className}`}>
      <img
        src={src}
        alt={alt}
        className="block h-full w-full"
        style={{ objectFit: fit, objectPosition, ...imageStyle }}
      />
    </div>
  );
}

function GeneralPhotoBox({ className = "", rounded = "rounded-[1.6rem]" }: { className?: string; rounded?: string }) {
  return <ImageBox src={HERO_IMAGE} className={className} rounded={rounded} />;
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

function DecorativeStar({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`h-px flex-1 ${dark ? "bg-[var(--samora-teal)]/35" : "bg-white/55"}`} />
      <span className={`mx-3 text-2xl leading-none ${dark ? "text-[var(--samora-teal)]" : "text-white"}`}>✦</span>
      <div className={`h-px flex-1 ${dark ? "bg-[var(--samora-teal)]/35" : "bg-white/55"}`} />
    </div>
  );
}

function ProposalShell({ quote, children }: { quote: ProposalQuote; children: ReactNode }) {
  const clientName = getVisibleClientName(quote);

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
          {children}
        </div>
      </main>

      <ProposalStyles />
    </>
  );
}

function WeddingProposal({ quote }: { quote: ProposalQuote }) {
  const clientName = getVisibleClientName(quote);
  const coupleSignature = getFirstNamePair(clientName);
  const meeting = getMeetingText(quote);
  const ceremonyLocation = getWeddingCeremonyLocation(quote);
  const receptionLocation = getWeddingReceptionLocation(quote);
  const eventDate = getEventDate(quote);
  const eventTime = getEventTime(quote);
  const guestCount = quote.guest_count ? `${quote.guest_count} personas` : "Por confirmar";

  return (
    <ProposalShell quote={quote}>

      {/* 01 - Portada principal */}
      <section className="proposal-sheet bg-[var(--samora-cream)] text-neutral-950">
        <div className="absolute inset-x-0 bottom-0 h-[43%] bg-[var(--samora-teal)]" />
        <div className="absolute left-1/2 top-[58px] h-[70px] w-[360px] -translate-x-1/2 rounded-[50%] border-t border-neutral-500/30" />

        <div className="relative z-10 flex h-full flex-col items-center px-12 pt-[68px] text-center">
          <p className="proposal-label text-neutral-700">Fotografía de bodas</p>

          <h2 className="proposal-display mt-4 text-[106px] uppercase leading-[0.78] tracking-[-0.07em] text-neutral-900">
            Servicios
          </h2>

          <p className="proposal-script -mt-1 text-[48px] text-neutral-800">
            & guía de precios
          </p>

          <ImageBox
            src={weddingImages.cover1}
            className="relative z-20 mt-[54px] h-[500px] w-[610px] max-w-full border-[9px] border-white shadow-[0_20px_38px_rgba(0,0,0,0.17)]"
            objectPosition="center 58%"
          />
        </div>
      </section>

      {/* 02 - Portada collage */}
      <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
        {/* Decoraciones suaves tipo plantilla original */}
        <div className="absolute -left-28 -top-8 h-[150px] w-[520px] rotate-[-14deg] rounded-full bg-[var(--samora-teal)]/20 blur-[10px]" />
        <div className="absolute -right-28 bottom-6 h-[145px] w-[520px] rotate-[-13deg] rounded-full bg-[var(--samora-teal)]/20 blur-[10px]" />

        <DecorativeStar dark className="absolute inset-x-10 top-[42px]" />

        <div className="relative z-10 flex h-full flex-col items-center px-12 pt-[72px] text-center">
          <p className="proposal-label text-neutral-700">Fotografía de bodas</p>

          <h2 className="proposal-display mt-4 text-[104px] uppercase leading-[0.78] tracking-[-0.07em] text-neutral-900">
            Servicios
          </h2>

          <p className="proposal-script -mt-1 text-[48px] text-neutral-800">
            & guía de precios
          </p>

          <div className="mt-[132px] flex h-[420px] w-[720px] max-w-full items-center justify-center">
            <img
              src={weddingImages.cover2}
              alt="Collage de bodas Samora"
              className="h-full w-full object-contain drop-shadow-[0_24px_32px_rgba(0,0,0,0.16)]"
              style={{ mixBlendMode: "multiply" }}
            />
          </div>
        </div>
      </section>

      {/* 03 - Hola */}
      <section className="proposal-sheet overflow-hidden bg-[var(--samora-teal)] text-white">
        <div className="relative h-[450px] w-full overflow-hidden">
          <img
            src={weddingImages.hello}
            alt="Pareja de boda caminando"
            className="absolute left-0 top-0 h-auto w-full"
            style={{
              transform: "translateY(-70px)",
            }}
          />
        </div>

        <div className="relative flex h-[390px] flex-col px-[58px] pt-[32px]">
          <h2 className="proposal-display text-[104px] leading-none tracking-[-0.055em] text-white">
            Hola!
          </h2>

          <p className="mt-5 max-w-[690px] text-[18px] font-normal leading-[1.48] tracking-[0.01em] text-white">
            En Samora Estudio Creativo nos complace acompañarlos en uno de los
            momentos más importantes de su vida. Somos un equipo creativo dedicado a
            la cobertura de eventos sociales, enfocado en capturar cada instante con
            sensibilidad, elegancia y profesionalismo. Nuestro objetivo es contar su
            historia de manera auténtica, cuidando cada detalle para que los recuerdos
            de este día especial perduren en el tiempo. Gracias por confiar en
            nosotros para ser parte de un momento tan significativo.
          </p>

          <div className="mt-8">
            <p className="proposal-script text-[52px] leading-none text-white">
              Jilly&Samantha
            </p>

            <p className="mt-2 text-[15px] uppercase tracking-[0.18em] text-white">
              Fotografía & diseño
            </p>
          </div>

          <div className="absolute bottom-[-110px] left-[22px] right-[22px] flex items-center gap-5">
            <div className="h-px flex-1 bg-white/75" />
            <span className="text-3xl leading-none text-white">✦</span>
            <div className="h-px flex-1 bg-white/75" />
          </div>
        </div>
      </section>

      {/* 04 - Nosotros */}
      <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
        <div className="absolute inset-y-0 left-0 w-[22%] bg-[var(--samora-teal)]" />

        <div className="relative z-10 ml-[22%] pl-[42px] pr-[46px] pt-[58px]">
          <h2 className="proposal-display text-[102px] leading-none tracking-[-0.055em] text-neutral-900">
            Nosotros
          </h2>

          <div className="mt-7 max-w-[565px] space-y-5 text-[21px] leading-[1.46] tracking-[0.004em] text-neutral-900">
            <p>
              Somos fotógrafos especializados en eventos sociales, con 5 años de
              experiencia capturando momentos que trascienden el tiempo. Nos apasiona
              registrar conexiones genuinas, miradas espontáneas y detalles que muchas
              veces pasan desapercibidos, pero que guardan la esencia real de cada
              historia.
            </p>

            <p>
              A lo largo de nuestra trayectoria hemos tenido el privilegio de documentar
              historias de amor con sensibilidad, cuidado y un enfoque auténtico. Sabemos
              que los momentos pasan, pero las fotografías permanecen; por eso buscamos
              que cada imagen se convierta en un recuerdo vivo para toda la vida.
            </p>

          </div>
        </div>

        <div className="absolute bottom-[56px] left-[50px] z-20 flex items-end">
          <TeamPhoto
            src={TEAM_OWNER_1_IMAGE}
            className="h-[258px] w-[258px]"
            objectPosition="center center"
            imageStyle={{ transform: "scale(1.05)" }}
          />

          <TeamPhoto
            src={TEAM_OWNER_2_IMAGE}
            className="-ml-[24px] h-[250px] w-[250px]"
            objectPosition="center center"
            imageStyle={{ transform: "translateY(-6px) scale(1.12)" }}
          />
        </div>
      </section>

      {/* 05 - Servicios / datos de boda */}
      <section className="proposal-sheet overflow-hidden bg-[var(--samora-teal)] text-white">
        <div className="grid h-full grid-cols-[43%_1fr]">
          <div className="grid h-full grid-rows-[27%_46%_27%] gap-0 pl-[42px] pr-[18px]">
            <ImageBox
              src={weddingImages.services1}
              className="h-full w-full"
              objectPosition="center 50%"
            />

            <ImageBox
              src={weddingImages.services2}
              className="h-full w-full"
              objectPosition="center 58%"
            />

            <ImageBox
              src={weddingImages.services3}
              className="h-full w-full"
              objectPosition="center 56%"
            />
          </div>

          <div className="flex h-full flex-col px-[28px] pb-[42px] pt-[44px]">
            <h2 className="proposal-display text-[78px] leading-none tracking-[-0.045em] text-white">
              Servicios
            </h2>

            <div className="mt-6 max-w-[455px] space-y-6 text-[18.5px] leading-[1.4] tracking-[0.006em] text-white/92">
              <p>
                Estimados{" "}
                <strong className="font-semibold text-[var(--samora-gold)]">
                  {clientName}
                </strong>
                , nos complace presentarles nuestras opciones de paquetes de
                fotografía para bodas, diseñados para capturar cada momento memorable
                de su día de manera auténtica, elegante y profesional.
              </p>

              <p>
                Nuestro enfoque se centra en documentar emociones reales y detalles
                significativos, creando un registro fiel de cada instante. A
                continuación, encontrarán las características de nuestros servicios,
                pensadas para acompañarlos en cada etapa de este día tan importante.
              </p>
            </div>

            <p className="proposal-script mt-8 text-[58px] leading-none text-[var(--samora-gold)]">
              {coupleSignature}
            </p>

            <div className="mt-8 grid gap-[11px]">
              <WeddingDataLine
                label="Día de boda:"
                value={formatDateOnly(eventDate)}
              />

              <WeddingDataLine
                label="Lugar de la ceremonia:"
                value={ceremonyLocation}
              />

              <WeddingDataLine
                label="Lugar recepción:"
                value={receptionLocation}
              />

              <WeddingDataLine
                label="Hora de inicio del cubrimiento:"
                value={eventTime}
              />

              <WeddingDataLine
                label="Número de invitados:"
                value={guestCount}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 06 - Paquete 1 Memoria */}
      <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
        <div className="absolute inset-x-0 bottom-0 h-[56px] bg-[var(--samora-teal)]" />

        <div className="grid h-full grid-cols-[39%_1fr]">
          <div className="grid h-[calc(100%-56px)] grid-rows-[41%_59%] gap-0">
            <ImageBox
              src={weddingImages.memoria1}
              className="h-full w-full"
              objectPosition="center 48%"
            />

            <ImageBox
              src={weddingImages.memoria2}
              className="h-full w-full"
              objectPosition="center 60%"
            />
          </div>

          <div className="px-[44px] py-[46px]">
            <p className="text-[18px] font-black uppercase tracking-[0.12em] text-[var(--samora-teal)]">
              {weddingPackages[0].number}
            </p>

            <h2 className="proposal-display mt-1 text-[86px] leading-[0.86] text-neutral-900">
              {weddingPackages[0].name}
            </h2>

            <p className="mt-5 max-w-[505px] text-justify text-[17.5px] leading-[1.42] tracking-[0.003em] text-neutral-800">
              {weddingPackages[0].intro}
            </p>

            <div className="mt-8 bg-[var(--samora-card)] px-8 py-8">
              <h3 className="proposal-display text-[47px] leading-[0.92] text-[var(--samora-teal)]">
                Registro fotográfico y videográfico
              </h3>

              <ul className="mt-6 grid gap-4">
                <WeddingFeatureItem title="PreCeremonia">
                  {" "}
                  · Momentos antes de la boda del novio y de la novia.
                </WeddingFeatureItem>

                <WeddingFeatureItem title="Cobertura fotográfica y videográfica de la ceremonia">
                  {" "}
                  religiosa o simbólica.
                </WeddingFeatureItem>

                <WeddingFeatureItem title="Sesión fotográfica">
                  {" "}
                  posterior a la ceremonia.
                </WeddingFeatureItem>

                <WeddingFeatureItem title="Recepción">
                  {" "}
                  · Entrada de los novios, brindis, vals, fotografías familiares,
                  invitados, detalles de decoración y momentos espontáneos.
                </WeddingFeatureItem>

                <WeddingFeatureItem title="Registro aéreo y terrestre">
                  {" "}
                  con drone y registro audiovisual desde tierra para complementar
                  la historia de la celebración.
                </WeddingFeatureItem>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 07 - Entregables Memoria */}
      <WeddingPackageDeliverables packageData={weddingPackages[0]} images={[weddingImages.memoria3, weddingImages.memoria4]} />

      {/* 08 - Paquete 2 Ideal */}
      <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
        <div className="absolute inset-x-0 bottom-0 h-[56px] bg-[var(--samora-teal)]" />

        <div className="px-[56px] pt-[50px]">
          <p className="text-[17px] font-black uppercase tracking-[0.12em] text-[var(--samora-teal)]">
            {weddingPackages[1].number}
          </p>

          <h2 className="proposal-display mt-1 text-[78px] leading-[0.86] text-neutral-900">
            {weddingPackages[1].name}
          </h2>

          <p className="mt-4 max-w-[810px] text-justify text-[16px] leading-[1.45] tracking-[0.002em] text-neutral-800">
            {weddingPackages[1].intro}
          </p>

          <div className="mt-6 h-[250px] w-full overflow-hidden bg-[var(--samora-card)]">
            <img
              src={weddingImages.ideal1}
              alt="Detalle de manos y ramo de boda"
              className="block h-auto w-full"
              style={{
                transform: "translateY(-280px) scale(1.05)",
                transformOrigin: "center top",
              }}
            />
          </div>

        </div>

        <div className="grid grid-cols-[1fr_39%] gap-8 px-[56px] pt-7">
          <div className="bg-[var(--samora-card)] px-8 py-7">
            <h3 className="proposal-display text-[43px] leading-none text-[var(--samora-teal)]">
              Registro fotográfico y videográfico
            </h3>

            <ul className="mt-6 grid gap-3.5">
              <CheckItem>
                <strong className="font-black">
                  Cobertura fotográfica y videográfica de la ceremonia
                </strong>{" "}
                religiosa o simbólica.
              </CheckItem>

              <CheckItem>
                <strong className="font-black">Sesión fotográfica</strong> posterior
                a la ceremonia.
              </CheckItem>

              <CheckItem>
                <strong className="font-black">Recepción</strong> · Momentos
                importantes de la celebración, entrada de los novios, brindis, vals,
                fotografías familiares, invitados, detalles de decoración y momentos
                espontáneos.
              </CheckItem>

              <CheckItem>
                <strong className="font-black">Registro aéreo y terrestre</strong>{" "}
                con drone y registro audiovisual desde tierra para complementar la
                historia de la celebración.
              </CheckItem>
            </ul>
          </div>

          <ImageBox
            src={weddingImages.ideal2}
            className="h-[405px] w-full"
            objectPosition="center 47%"
          />
        </div>
      </section>

      {/* 09 - Entregables Ideal */}
      <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
        <div className="absolute inset-x-0 bottom-0 h-[56px] bg-[var(--samora-teal)]" />

        <div className="h-[308px] w-full overflow-hidden bg-[var(--samora-card)]">
          <img
            src={weddingImages.ideal3}
            alt="Detalle de anillos de boda"
            className="block"
            style={{
              width: "100%",
              height: "auto",
              transform: "translateY(-480px) scale(1)",
              transformOrigin: "center top",
            }}
          />
        </div>

        <div className="grid grid-cols-[34%_1fr] gap-[30px] px-[46px] pt-[25px]">
          <div className="h-[580px] w-full overflow-hidden bg-[var(--samora-card)]">
            <img
              src={weddingImages.ideal4}
              alt="Pareja de boda tomada de la mano"
              className="block"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 58%",
              }}
            />
          </div>

          <div className="h-[580px] bg-[var(--samora-card)] px-8 pb-7 pt-7">
            <h2 className="proposal-display text-[47px] leading-none text-[var(--samora-teal)]">
              Entregables
            </h2>

            <ul className="mt-5 grid gap-3">
              <WeddingRichCheckItem>
                <strong className="font-black">
                  Aproximadamente 200 fotos digitales
                </strong>{" "}
                editadas en alta resolución.
              </WeddingRichCheckItem>

              <WeddingRichCheckItem>
                <strong className="font-black">Álbum digital</strong> con selección de
                las mejores fotografías mediante una plataforma online privada.
              </WeddingRichCheckItem>

              <WeddingRichCheckItem>
                <strong className="font-black">Video de la boda</strong> pieza
                audiovisual de aproximadamente{" "}
                <strong className="font-black">3 a 4 minutos</strong>, con los
                momentos más representativos de la celebración.
              </WeddingRichCheckItem>
            </ul>

            <h3 className="proposal-display mt-6 text-[40px] leading-none text-[var(--samora-teal)]">
              Recuerdo físico
            </h3>

            <ul className="mt-4 grid gap-3">
              <WeddingRichCheckItem>
                <strong className="font-black">Fotobook en pasta dura</strong> 15 × 20
                cm, con hasta 5 hojas.
              </WeddingRichCheckItem>

              <WeddingRichCheckItem>
                <strong className="font-black">Fotografía enmarcada</strong> 30 × 40
                cm.
              </WeddingRichCheckItem>

              <WeddingRichCheckItem>
                <strong className="font-black">Duración de cubrimiento:</strong> 4 a 5
                horas.
              </WeddingRichCheckItem>
            </ul>

            <div className="mt-5">
              <p className="text-[20px] font-black leading-tight text-[var(--samora-teal)]">
                Costo
              </p>

              <p className="proposal-display mt-1 whitespace-nowrap text-[52px] leading-none text-neutral-900">
                {weddingPackages[1].price}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 10 - Paquete 3 Esencial */}
      <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
        <div className="absolute inset-x-0 bottom-0 h-[56px] bg-[var(--samora-teal)]" />
        <div className="grid h-full grid-cols-[52%_1fr]">
          <div className="px-[48px] py-[50px]">
            <p className="text-[17px] font-black uppercase tracking-[0.12em] text-[var(--samora-teal)]">
              {weddingPackages[2].number}
            </p>
            <h2 className="proposal-display mt-1 text-[78px] leading-[0.86] text-neutral-900">
              {weddingPackages[2].name}
            </h2>
            <p className="mt-4 text-[15.2px] leading-[1.45] text-neutral-800">
              {weddingPackages[2].intro}
            </p>

            <div className="mt-6 bg-[var(--samora-card)] px-7 py-7">
              <h3 className="proposal-display text-[39px] leading-none text-[var(--samora-teal)]">
                Registro fotográfico y videográfico
              </h3>
              <ul className="mt-5 grid gap-3">
                {weddingPackages[2].coverage.map((item) => (
                  <CheckItem key={item}>{item}</CheckItem>
                ))}
              </ul>

              <h3 className="proposal-display mt-7 text-[39px] leading-none text-[var(--samora-teal)]">
                Entregables
              </h3>
              <ul className="mt-5 grid gap-3">
                {weddingPackages[2].deliverables.map((item) => (
                  <CheckItem key={item}>{item}</CheckItem>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid h-[calc(100%-56px)] grid-rows-[41%_1fr]">
            <ImageBox
              src={weddingImages.esencial1}
              className="h-full w-full"
              objectPosition="center 58%"
            />
            <div className="bg-[var(--samora-card)] px-8 py-9">
              <h3 className="proposal-display text-[44px] leading-none text-[var(--samora-teal)]">
                Recuerdo físico
              </h3>
              <ul className="mt-6 grid gap-3.5">
                {weddingPackages[2].physical.map((item) => (
                  <CheckItem key={item}>{item}</CheckItem>
                ))}
              </ul>
              <p className="mt-8 text-[15px] font-black text-[var(--samora-teal)]">Costo</p>
              <p className="proposal-display mt-1 whitespace-nowrap text-[64px] leading-none text-neutral-900">
                {weddingPackages[2].price}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 11 - Condiciones */}
      <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
        <div className="absolute inset-x-0 bottom-0 h-[56px] bg-[var(--samora-teal)]" />
        <div className="grid h-full grid-cols-[36%_1fr]">
          <div className="h-[calc(100%-56px)] w-full bg-[var(--samora-card)]">
            <ImageBox
              src={weddingImages.conditions}
              className="h-full w-full"
              objectPosition="42% center"
              fit="cover"
            />
          </div>
          <div className="px-[54px] py-[54px]">
            <p className="text-[20px] font-black uppercase tracking-[0.08em] text-[var(--samora-teal)]">
              Condiciones y
            </p>
            <h2 className="proposal-display text-[76px] leading-[0.82] text-neutral-900">
              Servicios
              <br />
              Extra
            </h2>

            <div className="mt-7 grid gap-5">
              <NumberedCondition
                index={1}
                title="Sesión fotográfica y selección de fotografías"
                text="El cliente tiene la opción de realizar la sesión fotográfica en un día diferente al evento de recepción, o el mismo día, una hora diferente a la de la recepción, sin costo adicional por subdividir el paquete. El cliente dispondrá de libertad para seleccionar las fotografías para impresión y selección de marcos disponibles."
              />
              <NumberedCondition
                index={2}
                title="Confirmación y reservas"
                text="Se requiere confirmación anticipada de al menos el 80% para asegurar la fecha del evento y acordar detalles específicos."
              />
              <NumberedCondition
                index={3}
                title="Hora adicional"
                text="La hora adicional será acordada con al menos 1 hora de anticipación y tendrá un costo adicional de $70.000. Cada hora adicional será continua."
              />
              <NumberedCondition
                index={4}
                title="Transporte y viáticos"
                text="Los viáticos y la movilización del equipo fotográfico están incluidos en cualquiera de los paquetes mencionados. Si el servicio de preboda se realiza fuera de Guatavita, será asumido por el cliente."
              />
            </div>
          </div>
        </div>
      </section>

      {/* 12 - Servicios adicionales */}
      <section className="proposal-sheet overflow-hidden bg-[var(--samora-teal)] text-white">
        <div className="grid h-full grid-rows-[35%_1fr]">
          <ImageBox src={weddingImages.extra} className="h-full w-full" objectPosition="center 68%" />
          <div className="relative grid grid-cols-2 gap-14 px-[70px] py-[62px]">
            <div>
              <p className="proposal-display text-[72px] leading-none text-[var(--samora-gold)]">05</p>
              <h3 className="mt-2 text-[18px] font-black uppercase tracking-[0.11em] text-[var(--samora-gold)]">
                Servicio adicional · Sesión pre-boda
              </h3>
              <p className="mt-6 text-[15px] leading-[1.48] text-white/90">
                Sesión fotográfica realizada días antes de la boda en locaciones, ideal para crear contenido para invitaciones, redes sociales y otros elementos de la celebración.
              </p>
              <p className="mt-7 text-[14.5px] leading-[1.48] text-white/90">
                <strong>Duración:</strong> 1 a 2 horas.<br />
                <strong>Entrega digital:</strong> 15 a 20 fotografías digitales editadas en alta resolución.<br />
                <strong>Reel de Pre-Boda:</strong> video tipo reel de 1 a 2 minutos.<br />
                <strong>Tiempo de entrega:</strong> aproximadamente 15 días hábiles.<br />
                <strong>Valor adicional:</strong> $500.000.
              </p>
            </div>

            <div>
              <p className="proposal-display text-[72px] leading-none text-[var(--samora-gold)]">06</p>
              <h3 className="mt-2 text-[18px] font-black uppercase tracking-[0.11em] text-[var(--samora-gold)]">
                Travesía mágica en velero · Servicio adicional
              </h3>
              <p className="mt-6 text-[15px] leading-[1.48] text-white/90">
                Sesión fotográfica de 1 hora a bordo de un velero. Puede realizarse en la sesión de boda o preboda, incluyendo ingreso al club privado y cubrimiento fotográfico de la experiencia.
              </p>
              <p className="mt-7 text-[14.5px] leading-[1.48] text-white/90">
                <strong>Duración:</strong> 1 hora.<br />
                <strong>Incluye:</strong> ingreso al club privado.<br />
                <strong>Máximo:</strong> 3 personas.<br />
                <strong>Valor adicional:</strong> $550.000.
              </p>
            </div>
            <DecorativeStar className="absolute inset-x-8 bottom-[32px]" />
          </div>
        </div>
      </section>

      {/* 13 - Reunión / cierre */}
      <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
        <div className="grid h-full grid-rows-[29%_1fr]">
          <ImageBox src={weddingImages.closing1} className="h-full w-full" objectPosition="center 70%" />
          <div className="grid grid-cols-[1fr_34%] gap-7 px-[44px] py-[42px]">
            <div>
              <div className="grid grid-cols-[72px_1fr] gap-4 border-b border-neutral-300 pb-4">
                <p className="proposal-display text-[62px] leading-none text-[var(--samora-teal)]">07</p>
                <div>
                  <h2 className="text-[17px] font-black uppercase tracking-[0.1em] text-[var(--samora-teal)]">
                    Reunión y coordinación del servicio
                  </h2>
                  <p className="mt-2 text-[13px] leading-[1.38] text-neutral-800">
                    Para garantizar que cada detalle quede claro, el equipo de Samora Estudio coordinará la reunión o canal de revisión definido con la pareja antes de la confirmación final del servicio.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-1.5 rounded-2xl border border-[var(--samora-teal)]/20 bg-white/45 p-4 text-[12.5px] leading-[1.45] text-neutral-800">
                <p><strong>Tipo de reunión:</strong> {meeting.type}</p>
                <p><strong>Estado:</strong> {meeting.status}</p>
                <p><strong>Fecha:</strong> {meeting.date}</p>
                <p><strong>Hora:</strong> {meeting.time}</p>
                <p><strong>Lugar / enlace:</strong> {meeting.location}</p>
              </div>

              <div className="mt-5 border-b border-neutral-800 pb-2.5">
                <h3 className="text-[16px] font-black uppercase tracking-[0.08em] text-neutral-900">
                  Servicio exclusivo de fotografía
                </h3>
              </div>

              <div className="mt-5">
                <h3 className="text-[15px] font-black uppercase tracking-[0.1em] text-[var(--samora-teal)]">
                  Portafolio de bodas y eventos especiales
                </h3>
                <p className="mt-2 text-[12px] leading-[1.38] text-neutral-700">
                  Consulta nuestro portafolio completo en la página web de Samora Estudio:
                  <br />
                  <a
                    href={getWeddingPortfolioUrl()}
                    className="break-all font-semibold text-[var(--samora-teal)] underline decoration-[var(--samora-teal)]/35 underline-offset-2"
                  >
                    {getWeddingPortfolioUrl()}
                  </a>
                </p>
              </div>

              <p className="mt-5 text-[12.3px] leading-[1.42] text-neutral-700">
                Esperamos que esta propuesta cumpla con tus expectativas. Estamos a tu disposición para cualquier consulta o ajuste que desees hacer. Será un honor ser parte de tu día especial y capturar esos momentos que recordarás para siempre.
              </p>

              <p className="mt-4 text-[12.3px] leading-[1.35] text-neutral-700">Atentamente,</p>
              <p className="proposal-script mt-1 text-[26px] text-neutral-900">
                Equipo de Samora Estudio Creativo
              </p>
              <p className="mt-2 text-[9.5px] uppercase tracking-[0.18em] text-neutral-500">
                Código: {quote.quote_code}
              </p>
            </div>

            <ImageBox src={weddingImages.closing2} className="h-[520px] w-full self-start bg-[var(--samora-card)]" objectPosition="center 54%" />
          </div>
        </div>
      </section>
    </ProposalShell>
  );
}


function WeddingPackageDeliverables({
  packageData,
  images,
  reverse = false,
}: {
  packageData: (typeof weddingPackages)[number];
  images: string[];
  reverse?: boolean;
}) {
  const isMemoria = packageData.name === "Memoria";

  if (isMemoria) {
    const imageColumn = (
      <div className="grid h-[calc(100%-56px)] grid-rows-[48%_52%] gap-0 bg-[var(--samora-card)]">
        <ImageBox
          src={images[0]}
          className="h-full w-full"
          objectPosition="center 52%"
        />

        <ImageBox
          src={images[1]}
          className="h-full w-full"
          objectPosition="center 68%"
        />
      </div>
    );

    return (
      <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
        <div className="absolute inset-x-0 bottom-0 h-[56px] bg-[var(--samora-teal)]" />

        <div className="grid h-full grid-cols-[55%_36%] justify-between">
          <div className="px-[48px] py-[46px]">
            <div className="min-h-[760px] bg-[var(--samora-card)] px-8 py-9">
              <h2 className="proposal-display text-[56px] leading-none text-[var(--samora-teal)]">
                Entregables
              </h2>

              <ul className="mt-6 grid gap-4">
                <WeddingRichCheckItem>
                  <strong className="font-black">
                    Aproximadamente 300 fotos digitales
                  </strong>{" "}
                  editadas en alta resolución.
                </WeddingRichCheckItem>

                <WeddingRichCheckItem>
                  <strong className="font-black">Álbum digital</strong> con selección
                  de las mejores fotografías mediante una plataforma online privada.
                </WeddingRichCheckItem>

                <WeddingRichCheckItem>
                  El álbum permitirá{" "}
                  <strong className="font-black">
                    visualizar, descargar y compartir
                  </strong>{" "}
                  las fotografías desde cualquier dispositivo.
                </WeddingRichCheckItem>

                <WeddingRichCheckItem>
                  <strong className="font-black">Video de la boda</strong> de
                  aproximadamente{" "}
                  <strong className="font-black">
                    4 a 5 minutos + clip tipo reel
                  </strong>{" "}
                  de 2 a 1 minutos con momentos representativos.
                </WeddingRichCheckItem>
              </ul>

              <h3 className="proposal-display mt-9 text-[48px] leading-none text-[var(--samora-teal)]">
                Recuerdo físico
              </h3>

              <ul className="mt-6 grid gap-4">
                <WeddingRichCheckItem>
                  <strong className="font-black">Photobook en pasta dura</strong>,
                  tamaño base 15 × 20 cm, hasta 5 hojas, diseño y selección de
                  fotografías incluido.
                </WeddingRichCheckItem>

                <WeddingRichCheckItem>
                  <strong className="font-black">Fotografía enmarcada</strong> 40 ×
                  50 cm.
                </WeddingRichCheckItem>

                <WeddingRichCheckItem>
                  <strong className="font-black">Opciones de personalización</strong>{" "}
                  con costo adicional según tamaño, número de hojas o referencia de
                  photobook.
                </WeddingRichCheckItem>

                <WeddingRichCheckItem>
                  <strong className="font-black">Duración de cubrimiento:</strong> 5
                  a 6 horas.
                </WeddingRichCheckItem>
              </ul>

              <p className="mt-9 text-[17px] font-black text-[var(--samora-teal)]">
                Costo
              </p>

              <p className="proposal-display mt-1 whitespace-nowrap text-[70px] leading-none text-neutral-900">
                {packageData.price}
              </p>
            </div>
          </div>

          {imageColumn}
        </div>
      </section>
    );
  }

  const imageRows = reverse ? "grid-rows-[30%_70%]" : "grid-rows-[47%_53%]";

  const imageColumn = (
    <div className={`grid h-[calc(100%-56px)] ${imageRows} gap-0 bg-[var(--samora-card)]`}>
      <ImageBox
        src={images[0]}
        className="h-full w-full"
        objectPosition={reverse ? "center 58%" : "center 52%"}
      />
      <ImageBox
        src={images[1]}
        className="h-full w-full"
        objectPosition={reverse ? "center 62%" : "center 66%"}
      />
    </div>
  );

  return (
    <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
      <div className="absolute inset-x-0 bottom-0 h-[56px] bg-[var(--samora-teal)]" />
      <div className={`grid h-full ${reverse ? "grid-cols-[40%_1fr]" : "grid-cols-[55%_1fr]"}`}>
        {reverse && imageColumn}

        <div className={reverse ? "px-[50px] py-[54px]" : "px-[48px] py-[50px]"}>
          <div className={`${reverse ? "min-h-[600px]" : "min-h-[760px]"} bg-[var(--samora-card)] px-8 py-9`}>
            <h2 className="proposal-display text-[54px] leading-none text-[var(--samora-teal)]">
              Entregables
            </h2>
            <ul className="mt-6 grid gap-4">
              {packageData.deliverables.map((item) => (
                <CheckItem key={item}>{item}</CheckItem>
              ))}
            </ul>

            <h3 className="proposal-display mt-9 text-[47px] leading-none text-[var(--samora-teal)]">
              Recuerdo físico
            </h3>
            <ul className="mt-6 grid gap-4">
              {packageData.physical.map((item) => (
                <CheckItem key={item}>{item}</CheckItem>
              ))}
            </ul>

            <p className="mt-9 text-[16px] font-black text-[var(--samora-teal)]">
              Costo
            </p>
            <p className="proposal-display mt-1 whitespace-nowrap text-[68px] leading-none text-neutral-900">
              {packageData.price}
            </p>
          </div>
        </div>

        {!reverse && imageColumn}
      </div>
    </section>
  );
}

function GeneralProposal({ quote }: { quote: ProposalQuote }) {
  const profile = getGeneralProfile(quote);
  const clientName = getVisibleClientName(quote);
  const initials = getInitials(clientName);
  const eventDate = getEventDate(quote);
  const eventLocation = getEventLocation(quote);
  const eventTime = getEventTime(quote);
  const duration = getDurationLabel(quote);
  const quantityValue = getQuantityValue(quote, profile);
  const packageName = quote.selected_package?.trim() || profile.packageLabel;
  const deliveryItems = getDeliveryItems(quote, profile);
  const finalConditions = getFinalConditions(quote);
  const meeting = getMeetingText(quote);

  return (
    <ProposalShell quote={quote}>
      <section className="proposal-sheet bg-[var(--samora-cream)] text-neutral-950">
        <div className="absolute inset-x-0 bottom-0 h-[29%] bg-[var(--samora-teal)]" />
        <div className="relative z-10 flex h-full flex-col items-center px-12 pt-16 text-center">
          <p className="proposal-label text-neutral-700">{profile.eyebrow}</p>
          <h2 className="proposal-display mt-5 text-[108px] uppercase leading-[0.78] tracking-[-0.07em] text-neutral-900">
            Servicios
          </h2>
          <p className="proposal-script -mt-1 text-[50px] text-neutral-800">
            {profile.coverSubtitle}
          </p>
          <GeneralPhotoBox className="relative mt-8 h-[390px] w-[655px] max-w-full border-[10px] border-white shadow-xl" rounded="rounded-none" />
        </div>
      </section>

      <section className="proposal-sheet overflow-hidden bg-[var(--samora-teal)] text-white">
        <div className="grid h-full grid-rows-[40%_1fr]">
          <GeneralPhotoBox className="h-full w-full" rounded="rounded-none" />
          <div className="relative p-12">
            <p className="proposal-display text-[82px] leading-none text-white">Hola!</p>
            <p className="mt-5 max-w-[680px] text-[15px] leading-[1.55] text-white/90">
              {profile.helloText} Gracias por permitirnos presentar una guía pensada para revisar detalles, condiciones y próximos pasos del servicio.
            </p>
            <div className="mt-8">
              <p className="proposal-script text-[56px] leading-none text-white">{TEAM_SIGNATURE}</p>
              <p className="mt-1 text-[14px] uppercase tracking-[0.12em] text-white/80">{TEAM_SIGNATURE_SUBTITLE}</p>
            </div>
            <DecorativeStar className="absolute inset-x-0 bottom-9 px-8" />
          </div>
        </div>
      </section>

      <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
        <div className="absolute inset-y-0 left-0 w-[27%] bg-[var(--samora-teal)]" />
        <div className="relative z-10 ml-[27%] px-10 pt-12">
          <h2 className="proposal-display text-[86px] leading-none text-neutral-900">Nosotros</h2>
          <p className="mt-6 max-w-[535px] text-[17.2px] leading-[1.42] tracking-[0.01em] text-neutral-900">
            Somos fotógrafos especializados en eventos sociales y proyectos visuales, con 5 años de experiencia capturando momentos que trascienden el tiempo. Nos apasiona registrar conexiones genuinas y momentos reales, esos instantes espontáneos que cuentan historias de manera auténtica. Sabemos que los momentos pasan, pero las fotografías permanecen, y nuestro objetivo es que esas imágenes se conviertan en recuerdos para toda la vida.
          </p>
        </div>
        <div className="absolute bottom-[98px] left-[56px] z-20 flex items-end">
          <TeamPhoto src={TEAM_OWNER_1_IMAGE} className="h-[225px] w-[225px]" />
          <TeamPhoto src={TEAM_OWNER_2_IMAGE} className="-ml-[20px] h-[218px] w-[218px]" imageStyle={{ transform: "translateY(-10px) scale(1.16)" }} />
        </div>
      </section>

      <section className="proposal-sheet overflow-hidden bg-[var(--samora-teal)] text-white">
        <div className="grid h-full grid-cols-[42%_1fr]">
          <div className="grid h-full grid-rows-[27%_43%_30%] gap-0">
            <GeneralPhotoBox className="h-full w-full" rounded="rounded-none" />
            <GeneralPhotoBox className="h-full w-full" rounded="rounded-none" />
            <GeneralPhotoBox className="h-full w-full" rounded="rounded-none" />
          </div>
          <div className="p-10">
            <h2 className="proposal-display text-[70px] leading-none text-white">{profile.serviceTitle}</h2>
            <p className="mt-4 text-[13.5px] leading-[1.45] text-white/88">
              Estimado/a <strong>{clientName}</strong>, nos complace presentar esta guía inicial para <strong>{quote.service_label}</strong>. {profile.serviceIntro}
            </p>
            <p className="proposal-script mt-7 text-[38px] text-[var(--samora-gold)]">{clientName}</p>
            <div className="mt-8 grid gap-5">
              <DataBlock label="Fecha del servicio" value={formatDateOnly(eventDate)} />
              <DataBlock label="Lugar" value={eventLocation} />
              <DataBlock label="Hora de inicio" value={eventTime} />
              <DataBlock label="Duración" value={duration} />
              <DataBlock label={profile.quantityLabel} value={quantityValue} />
            </div>
          </div>
        </div>
      </section>

      <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
        <div className="grid h-full grid-cols-[43%_1fr]">
          <GeneralPhotoBox className="h-full w-full" rounded="rounded-none" />
          <div className="px-11 py-12">
            <p className="text-[17px] font-black uppercase tracking-[0.12em] text-[var(--samora-teal)]">Propuesta inicial</p>
            <h2 className="proposal-display mt-1 text-[78px] leading-[0.88] text-neutral-900">{packageName}</h2>
            <p className="mt-4 text-[13.5px] leading-[1.45] text-neutral-800">{profile.coverageIntro}</p>
            <div className="mt-5 bg-[var(--samora-card)] p-6">
              <h3 className="proposal-display text-[44px] leading-none text-[var(--samora-teal)]">{profile.coverageTitle}</h3>
              <ul className="mt-5 grid gap-3.5">
                {profile.coverageItems.map((item) => <CheckItem key={item}>{item}</CheckItem>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
        <div className="grid h-full grid-cols-[56%_1fr]">
          <div className="p-10">
            <div className="bg-[var(--samora-card)] p-6">
              <h2 className="proposal-display text-[42px] leading-none text-[var(--samora-teal)]">{profile.deliverableTitle}</h2>
              <ul className="mt-5 grid gap-3.5">
                {deliveryItems.map((item) => <CheckItem key={item}>{item}</CheckItem>)}
              </ul>
              <h3 className="proposal-display mt-8 text-[36px] leading-none text-[var(--samora-teal)]">Coordinación</h3>
              <ul className="mt-4 grid gap-3.5">
                <CheckItem>Tipo de reunión: {meeting.type}.</CheckItem>
                <CheckItem>Fecha de reunión: {meeting.date}.</CheckItem>
                <CheckItem>Hora de reunión: {meeting.time}.</CheckItem>
                <CheckItem>La reserva formal y valores finales se confirman en la constancia de reserva.</CheckItem>
              </ul>
            </div>
          </div>
          <div className="grid h-full grid-rows-2 gap-0">
            <GeneralPhotoBox className="h-full w-full" rounded="rounded-none" />
            <GeneralPhotoBox className="h-full w-full" rounded="rounded-none" />
          </div>
        </div>
      </section>

      <section className="proposal-sheet overflow-hidden bg-[var(--samora-cream)] text-neutral-950">
        <div className="grid h-full grid-rows-[24%_1fr]">
          <GeneralPhotoBox className="h-full w-full" rounded="rounded-none" />
          <div className="grid grid-cols-[1fr_34%] gap-7 px-9 py-7">
            <div>
              <div className="grid grid-cols-[62px_1fr] gap-4 border-b border-neutral-300 pb-3.5">
                <p className="proposal-display text-[54px] leading-none text-[var(--samora-teal)]">01</p>
                <div>
                  <h2 className="text-[14px] font-black uppercase tracking-[0.1em] text-[var(--samora-teal)]">Siguientes pasos</h2>
                  <p className="mt-1.5 text-[12px] leading-[1.36] text-neutral-800">Esta guía resume el servicio solicitado y sirve como base para revisar detalles, resolver dudas y coordinar la confirmación del servicio.</p>
                </div>
              </div>
              <div className="mt-5">
                <h3 className="text-[13px] font-black uppercase tracking-[0.12em] text-neutral-800">Condiciones generales</h3>
                <ul className="mt-2 grid gap-1.5">
                  {finalConditions.slice(0, 4).map((item) => (
                    <li key={item} className="text-[10.5px] leading-[1.32] text-neutral-700">• {item}</li>
                  ))}
                </ul>
              </div>
              <p className="mt-5 text-[11.5px] leading-[1.42] text-neutral-700">{profile.closingText}</p>
              <p className="mt-3 text-[11.5px] leading-[1.35] text-neutral-700">Atentamente,</p>
              <p className="proposal-script mt-1 text-[24px] text-neutral-900">Equipo de Samora Estudio Creativo</p>
              <p className="mt-2 text-[9px] uppercase tracking-[0.18em] text-neutral-500">Código: {quote.quote_code}</p>
            </div>
            <div className="relative self-start">
              <GeneralPhotoBox className="h-[245px] w-full" rounded="rounded-none" />
              <div className="absolute -bottom-4 left-1/2 flex h-20 w-20 -translate-x-1/2 items-center justify-center rounded-full bg-[var(--samora-teal)] text-xl font-black text-white shadow-xl">{initials}</div>
            </div>
          </div>
        </div>
      </section>
    </ProposalShell>
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
  const templateKind = getTemplateKind(typedQuote.service_type);

  if (templateKind === "wedding") {
    return <WeddingProposal quote={typedQuote} />;
  }

  return <GeneralProposal quote={typedQuote} />;
}

function ProposalStyles() {
  return (
    <style>{`
      :root {
        --samora-teal: ${SAMORA_TEAL};
        --samora-teal-dark: ${SAMORA_TEAL_DARK};
        --samora-cream: ${SAMORA_CREAM};
        --samora-card: ${SAMORA_CARD};
        --samora-gold: ${SAMORA_GOLD};
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
        min-height: 960px;
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
          size: 8.5in 8.5in;
          margin: 0;
        }

        html,
        body {
          width: 8.5in !important;
          min-width: 8.5in !important;
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
          width: 8.5in !important;
          height: 8.5in !important;
          min-height: 8.5in !important;
          max-height: 8.5in !important;
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
  );
}
