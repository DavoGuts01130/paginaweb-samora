import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Fotografía profesional para retratos, eventos, productos y recuerdos impresos con un estilo elegante, auténtico y atemporal.",
  alternates: {
    canonical: "/",
  },
};

const HERO_IMAGE = "/hero.png";

const heroActions = [
  {
    label: "Ver portafolio",
    href: "/portafolio",
    variant: "primary",
  },
  {
    label: "Realizar cotización",
    href: "/servicios#cotizador",
    variant: "outline",
  },
  {
    label: "Ver servicios",
    href: "/servicios",
    variant: "outline",
  },
];

const heroTags = [
  "Retratos profesionales",
  "Eventos y recuerdos",
  "Productos impresos",
];

const services = [
  {
    title: "Sesiones fotográficas",
    description:
      "Retratos, parejas, embarazo, mascotas y propuestas visuales pensadas desde la personalidad de cada cliente.",
  },
  {
    title: "Eventos especiales",
    description:
      "Bodas, bautizos, quince años, grados, eventos sociales y empresariales con una mirada documental y estética.",
  },
  {
    title: "Producto y marca",
    description:
      "Fotografía gastronómica, espacios, productos, contenido para redes y material visual para emprendimientos.",
  },
  {
    title: "Impresión y recuerdos",
    description:
      "Fotografías impresas, marcos, entregas físicas y productos pensados para conservar momentos importantes.",
  },
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black text-white">
        <section className="relative isolate overflow-hidden border-b border-white/10">
          {/* Imagen desktop */}
          <div
            className="absolute inset-0 hidden bg-cover bg-center md:block"
            style={{
              backgroundImage: `url('${HERO_IMAGE}')`,
            }}
          />

          {/* Overlays desktop */}
          <div className="absolute inset-0 hidden bg-gradient-to-r from-black via-black/40 to-black/10 md:block" />
          <div className="absolute inset-0 hidden bg-gradient-to-t from-black via-black/28 to-black/10 md:block" />
          <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_50%_42%,rgba(0,0,0,0.08),rgba(0,0,0,0.5)_55%,rgba(0,0,0,0.92)_100%)] md:block" />

          {/* Fondo móvil premium */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.08),transparent_34%),linear-gradient(to_bottom,#000,#060606_48%,#000)] md:hidden" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035),transparent_18%,transparent_82%,rgba(255,255,255,0.035))] md:hidden" />

          <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 pt-24 sm:px-6 md:px-6 md:pb-14 md:pt-28 lg:px-8">
            <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center text-center">
              {/* Imagen móvil como tarjeta visual */}
              <div className="relative mb-8 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/10 bg-neutral-950 shadow-[0_24px_90px_rgba(0,0,0,0.55)] md:hidden">
                <div
                  className="h-[245px] bg-cover bg-[62%_center]"
                  style={{
                    backgroundImage: `url('${HERO_IMAGE}')`,
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black/68 via-black/10 to-black/8" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/8 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/15 bg-black/45 px-4 py-2 text-[0.62rem] uppercase tracking-[0.28em] text-white/70 backdrop-blur-md">
                    Samora Estudio
                  </span>

                  <span className="h-2 w-2 rounded-full bg-white/70 shadow-[0_0_18px_rgba(255,255,255,0.65)]" />
                </div>
              </div>

              <p className="hidden text-xs uppercase tracking-[0.42em] text-white/60 md:block md:text-sm">
                Samora Estudio
              </p>

              <h1 className="max-w-5xl text-[2.15rem] font-bold leading-[0.98] tracking-[-0.065em] text-white sm:text-5xl md:mt-6 md:text-7xl lg:text-8xl">
                Capturamos momentos que merecen quedarse para siempre
              </h1>

              <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
                Fotografía profesional para retratos, eventos, productos y
                recuerdos impresos con un estilo elegante, auténtico y atemporal.
              </p>

              <div className="mt-9 grid w-full max-w-md gap-3 md:flex md:max-w-none md:flex-wrap md:justify-center">
                {heroActions.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={
                      action.variant === "primary"
                        ? "inline-flex min-h-12 items-center justify-center rounded-full border border-white bg-white px-7 py-3 text-sm font-medium !text-black transition hover:scale-[1.02] hover:bg-white hover:!text-black"
                        : "inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-black/20 px-7 py-3 text-sm font-medium !text-white transition hover:border-white hover:bg-white hover:!text-black"
                    }
                  >
                    {action.label}
                  </Link>
                ))}
              </div>

              <div className="mt-11 grid w-full max-w-md gap-3 md:mt-14 md:max-w-4xl md:grid-cols-3">
                {heroTags.map((tag) => (
                  <div
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm text-white/55 backdrop-blur-md"
                  >
                    {tag}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                Lo que hacemos
              </p>

              <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">
                Fotografía para historias, marcas y recuerdos especiales.
              </h2>
            </div>

            <Link
              href="/servicios"
              className="inline-flex min-h-12 w-fit items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium !text-white/70 transition hover:border-white hover:bg-white hover:!text-black"
            >
              Ver servicios →
            </Link>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {services.map((service) => (
              <article
                key={service.title}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/25"
              >
                <div className="mb-10 h-px w-full bg-gradient-to-r from-white/30 via-white/10 to-transparent" />

                <h3 className="text-2xl font-semibold tracking-[-0.03em]">
                  {service.title}
                </h3>

                <p className="mt-4 text-sm leading-6 text-white/50 sm:text-base sm:leading-7">
                  {service.description}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}