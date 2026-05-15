import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fotografía profesional para momentos memorables",
  description:
    "Samora Studio captura retratos, eventos, productos y recuerdos impresos con una estética elegante, auténtica y atemporal.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Samora Studio | Fotografía profesional",
    description:
      "Fotografía profesional para retratos, eventos, productos y recuerdos impresos.",
    url: "/",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Samora Studio",
      },
    ],
  },
};

const HERO_IMAGE = "/hero.png";
const HERO_VIDEO = "";
const LOGO_IMAGE = "";

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black text-white">
        <section className="relative flex min-h-screen overflow-hidden px-4 pt-24 sm:px-6">
          {/* Fondo */}
          <div className="absolute inset-0">
            {HERO_VIDEO ? (
              <video
                src={HERO_VIDEO}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full scale-105 object-cover opacity-35"
              />
            ) : (
              <img
                src={HERO_IMAGE}
                alt="Fotografía profesional Samora Studio"
                className="h-full w-full scale-105 object-cover opacity-90"
              />
            )}

              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-black/20" />
          </div>

          {/* Glow */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[110px] sm:h-[420px] sm:w-[420px] sm:blur-[140px]" />

          {/* Contenido */}
          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-center py-12 text-center sm:py-16 md:py-20">
            {/* Logo / Texto */}
            {LOGO_IMAGE ? (
              <img
                src={LOGO_IMAGE}
                alt="Samora Studio"
                className="mb-6 h-12 w-auto object-contain sm:h-14"
              />
            ) : (
              <p className="mb-5 text-xs uppercase tracking-[0.38em] text-white/55 sm:text-sm sm:tracking-[0.45em]">
                Samora Studio
              </p>
            )}

            {/* Título */}
            <h1 className="max-w-5xl text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl md:text-7xl lg:text-8xl">
              Capturamos momentos que merecen quedarse para siempre
            </h1>

            {/* Descripción */}
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/70 sm:mt-7 md:text-xl md:leading-8">
              Fotografía profesional para retratos, eventos, productos y
              recuerdos impresos con un estilo elegante, auténtico y atemporal.
            </p>

            {/* Botones */}
            <div className="mt-9 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-4">
              <Link
                href="/portafolio"
                className="premium-button flex min-h-12 items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition hover:scale-105 hover:bg-white/90"
              >
                Ver portafolio
              </Link>

              <Link
                href="/servicios"
                className="flex min-h-12 items-center justify-center rounded-full border border-white/30 px-8 py-3 text-sm font-medium text-white transition hover:bg-white hover:text-black"
              >
                Ver servicios
              </Link>
            </div>

            {/* Badges */}
            <div className="mt-12 grid w-full max-w-md gap-3 text-sm text-white/60 sm:mt-16 sm:max-w-3xl sm:grid-cols-3">
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 backdrop-blur-md">
                Retratos profesionales
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 backdrop-blur-md">
                Eventos y recuerdos
              </div>

              <div className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 backdrop-blur-md">
                Productos impresos
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}