import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ServiceQuoteForm from "@/components/ServiceQuoteForm";

export const metadata: Metadata = {
  title: "Servicios de fotografía profesional",
  description:
    "Servicios de fotografía profesional para matrimonios, quince años, bautizos, cumpleaños, grados, eventos empresariales, retratos, producto, gastronomía, impresiones y desarrollo web.",
  alternates: {
    canonical: "/servicios",
  },
  openGraph: {
    title: "Servicios de fotografía profesional | Samora Estudio",
    description:
      "Fotografía profesional para eventos, marcas y recuerdos especiales. Solicita una propuesta personalizada según tu evento, ubicación y entregables.",
    url: "/servicios",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Servicios de fotografía profesional Samora Estudio",
      },
    ],
  },
};

const services = [
  {
    title: "Matrimonios y bodas",
    description:
      "Cobertura fotográfica y audiovisual para ceremonia, recepción, sesión de pareja, preboda, álbum digital, photobook y recuerdos impresos.",
    href: "/portafolio/eventos-especiales",
    action: "Ver bodas y eventos",
  },
  {
    title: "Quince años, bautizos y cumpleaños",
    description:
      "Registro de celebraciones familiares y eventos sociales con enfoque en momentos importantes, invitados, detalles y recuerdos especiales.",
    href: "/portafolio/eventos-especiales",
    action: "Ver celebraciones",
  },
  {
    title: "Grados y eventos escolares",
    description:
      "Fotografía para instituciones, estudiantes, grupos, cartillas, paquetes escolares y entregables digitales o impresos.",
    href: "/portafolio/eventos-especiales",
    action: "Ver eventos escolares",
  },
  {
    title: "Eventos empresariales",
    description:
      "Cobertura para reuniones, lanzamientos, conferencias, actividades corporativas y contenido visual para marcas o equipos.",
    href: "/portafolio/eventos-especiales",
    action: "Ver eventos empresariales",
  },
  {
    title: "Retratos y sesiones personales",
    description:
      "Sesiones individuales, pareja, embarazo, familia, mascotas, perfiles profesionales, artistas y marca personal.",
    href: "/portafolio/retratos",
    action: "Ver retratos",
  },
  {
    title: "Producto, gastronomía y espacios",
    description:
      "Fotografía para restaurantes, coctelería, productos, hospedajes, espacios comerciales, catálogos, redes sociales y tiendas online.",
    href: "/portafolio/fotografia-de-producto",
    action: "Ver fotografía comercial",
  },
  {
    title: "Impresiones, marcos y recuerdos",
    description:
      "Fotos impresas, ampliaciones, marcos, photobooks, recuerdos físicos y productos personalizados para conservar momentos especiales.",
    href: "/tienda",
    action: "Ver tienda",
  },
  {
    title: "Desarrollo web y software",
    description:
      "Páginas web, catálogos digitales, tiendas online y soluciones a medida para marcas, negocios o proyectos creativos.",
    href: "/contacto",
    action: "Consultar servicio",
  },
];

export default function ServiciosPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-16">
          {/* HERO */}
          <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div className="animate-fade-up">
              <p className="text-sm uppercase tracking-[0.35em] text-white/35">
                Servicios
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl md:text-7xl">
                Fotografía profesional para eventos, marcas y recuerdos
                especiales.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
                Explora nuestros servicios, revisa trabajos relacionados y
                solicita una propuesta personalizada según tu evento, ubicación,
                entregables y necesidades.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">
                Cotización personalizada
              </p>

              <p className="mt-4 text-2xl font-semibold tracking-[-0.03em]">
                Cuéntanos qué necesitas y prepararemos una propuesta según tu
                evento, lugar, fecha y entregables.
              </p>

              <a
                href="#cotizador"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
              >
                Realizar cotización
              </a>
            </div>
          </div>

          {/* SERVICIOS */}
          <div className="mt-10 grid gap-5 sm:mt-12 md:mt-14 md:grid-cols-2 md:gap-6">
            {services.map((service, index) => (
              <Link
                key={service.title}
                href={service.href}
                className="group premium-card premium-card-hover rounded-[1.5rem] p-6 transition hover:border-white/25 md:p-7"
              >
                <p className="text-sm uppercase tracking-[0.3em] text-white/30">
                  {String(index + 1).padStart(2, "0")}
                </p>

                <h2 className="mt-4 text-xl font-semibold sm:text-2xl">
                  {service.title}
                </h2>

                <p className="mt-4 text-sm leading-7 text-white/50 md:text-base">
                  {service.description}
                </p>

                <p className="mt-6 inline-flex items-center text-sm font-medium text-white/65 transition group-hover:translate-x-1 group-hover:text-white">
                  {service.action} →
                </p>
              </Link>
            ))}
          </div>

          <ServiceQuoteForm />

          {/* CTA */}
          <section className="premium-card mt-12 rounded-[1.75rem] p-6 sm:p-8 md:mt-14 md:flex md:items-center md:justify-between md:gap-8 md:rounded-[2rem]">
            <div>
              <h2 className="text-2xl font-semibold md:text-3xl">
                ¿Buscas una propuesta completamente personalizada?
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-white/50 md:text-base">
                Podemos adaptar el servicio según el tipo de evento, sesión,
                cantidad de fotografías, estilo visual, formato de entrega,
                producto impreso o desarrollo digital que necesites.
              </p>
            </div>

            <Link
              href="/contacto"
              className="premium-button mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:scale-[1.02] md:mt-0 md:shrink-0"
            >
              Solicitar información
            </Link>
          </section>
        </section>
      </main>
    </>
  );
}
