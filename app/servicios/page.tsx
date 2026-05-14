import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Servicios de fotografía profesional",
  description:
    "Servicios de fotografía profesional para retratos, eventos, productos e impresiones fotográficas. Sesiones visuales con estética elegante y entrega cuidada.",
  alternates: {
    canonical: "/servicios",
  },
  openGraph: {
    title: "Servicios de fotografía profesional | Samora Studio",
    description:
      "Retratos profesionales, fotografía de eventos, fotografía de producto e impresiones fotográficas con presentación premium.",
    url: "/servicios",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Servicios de fotografía profesional Samora Studio",
      },
    ],
  },
};

const services = [
  {
    title: "Retratos profesionales",
    description:
      "Sesiones fotográficas para perfiles personales, profesionales, artísticos, familiares o marca personal.",
  },
  {
    title: "Eventos y celebraciones",
    description:
      "Cobertura fotográfica para momentos especiales, celebraciones, reuniones y recuerdos importantes.",
  },
  {
    title: "Fotografía de producto",
    description:
      "Imágenes para tiendas, marcas y emprendimientos que necesitan presentar sus productos con mayor calidad visual.",
  },
  {
    title: "Impresiones y recuerdos",
    description:
      "Productos fotográficos impresos para conservar momentos importantes con una presentación elegante y duradera.",
  },
];

export default function ServiciosPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-16">
          {/* HERO */}
          <div className="animate-fade-up">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Servicios
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl md:text-7xl">
              Servicios de fotografía profesional para momentos que importan.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
              En Samora Studio diseñamos experiencias visuales para personas,
              marcas, eventos y recuerdos que merecen una presentación cuidada,
              auténtica y atemporal.
            </p>
          </div>

          {/* SERVICIOS */}
          <div className="mt-10 grid gap-5 sm:mt-12 md:mt-14 md:grid-cols-2 md:gap-6">
            {services.map((service, index) => (
              <article
                key={service.title}
                className="premium-card premium-card-hover rounded-[1.5rem] p-6 md:p-7"
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
              </article>
            ))}
          </div>

          {/* CTA */}
          <section className="premium-card mt-12 rounded-[1.75rem] p-6 sm:p-8 md:mt-14 md:flex md:items-center md:justify-between md:gap-8 md:rounded-[2rem]">
            <div>
              <h2 className="text-2xl font-semibold md:text-3xl">
                ¿Buscas una sesión fotográfica personalizada?
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-7 text-white/50 md:text-base">
                Podemos adaptar el servicio según el tipo de sesión, cantidad de
                fotografías, estilo visual, formato de entrega o producto
                impreso.
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