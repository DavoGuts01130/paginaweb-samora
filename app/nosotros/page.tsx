import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Conoce Samora Studio, un estudio fotográfico enfocado en crear imágenes con intención, emoción y permanencia para personas, marcas y recuerdos especiales.",
  alternates: {
    canonical: "/nosotros",
  },
  openGraph: {
    title: "Nosotros | Samora Studio",
    description:
      "Creamos imágenes con intención, emoción y permanencia. Fotografía profesional con estética elegante y contemporánea.",
    url: "/nosotros",
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

const values = [
  "Estética limpia y elegante",
  "Atención cercana y personalizada",
  "Cuidado en cada detalle visual",
  "Entrega responsable y organizada",
];

export default function NosotrosPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          {/* HERO */}
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">
            <div className="animate-fade-up">
              <p className="text-xs uppercase tracking-[0.35em] text-white/35 sm:text-sm">
                Nosotros
              </p>

              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl md:text-6xl lg:text-7xl">
                Un estudio fotográfico creado para capturar imágenes con
                intención.
              </h1>

              <p className="mt-6 text-base leading-7 text-white/55 sm:text-lg sm:leading-8">
                Samora Studio nace como una propuesta visual enfocada en
                capturar momentos auténticos y transformarlos en recuerdos
                duraderos, con una estética sobria, elegante y contemporánea.
              </p>
            </div>

            <div className="premium-card overflow-hidden rounded-[2rem]">
              <img
                src="/hero.jpg"
                alt="Equipo y estilo visual de Samora Studio"
                className="image-premium h-[280px] w-full object-cover opacity-80 sm:h-[420px] lg:h-[520px]"
              />
            </div>
          </div>

          {/* VALORES */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-6">
            {values.map((value) => (
              <div
                key={value}
                className="premium-card premium-card-hover rounded-[1.5rem] p-5 sm:p-6"
              >
                <p className="text-sm leading-6 text-white/55">{value}</p>
              </div>
            ))}
          </div>

          {/* FILOSOFÍA */}
          <section className="mt-12 max-w-4xl lg:mt-16">
            <p className="text-xs uppercase tracking-[0.35em] text-white/35 sm:text-sm">
              Filosofía
            </p>

            <h2 className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.03em] sm:text-3xl md:text-4xl lg:text-5xl">
              No se trata solo de tomar fotografías, sino de construir recuerdos
              con valor.
            </h2>

            <p className="mt-6 text-base leading-7 text-white/55 sm:text-lg sm:leading-8">
              Cada sesión, producto o entrega se piensa desde la experiencia del
              cliente: cómo se siente, cómo se recuerda y cómo permanece en el
              tiempo.
            </p>
          </section>
        </section>
      </main>
    </>
  );
}