import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta a Samora Studio para cotizar sesiones fotográficas, fotografía de eventos, retratos profesionales, productos impresos y entregas.",
  alternates: {
    canonical: "/contacto",
  },
  openGraph: {
    title: "Contacto | Samora Studio",
    description:
      "Escríbenos para cotizar una sesión fotográfica, consultar disponibilidad o resolver dudas sobre productos y entregas.",
    url: "/contacto",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Contacto Samora Studio",
      },
    ],
  },
};

const whatsappNumber = "573192709536";

const whatsappMessage = encodeURIComponent(
  "Hola, quiero recibir información sobre los servicios de Samora Studio."
);

const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

const quickActions = [
  "Cotizar una sesión",
  "Consultar disponibilidad",
  "Preguntar por productos impresos",
  "Seguimiento de entrega",
];

export default function ContactoPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-14">
            {/* CONTENIDO PRINCIPAL */}
            <div className="animate-fade-up">
              <p className="text-xs uppercase tracking-[0.35em] text-white/35 sm:text-sm">
                Contacto
              </p>

              <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[0.98] tracking-[-0.05em] sm:text-5xl md:text-6xl lg:text-7xl">
                Hablemos de tu próxima historia, evento o producto.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 sm:text-lg sm:leading-8">
                Escríbenos para consultar disponibilidad, cotizar una sesión,
                planear la cobertura de un evento o resolver dudas sobre
                productos impresos, entregas y pedidos.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="premium-button inline-flex min-h-12 items-center justify-center rounded-full bg-white px-8 py-3 text-center text-sm font-medium text-black transition hover:scale-[1.02]"
                >
                  Escribir por WhatsApp
                </a>

                <Link
                  href="/tienda"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 px-8 py-3 text-center text-sm text-white/75 transition hover:bg-white hover:text-black"
                >
                  Ver productos y servicios
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <div
                    key={action}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4"
                  >
                    <p className="text-sm text-white/55">{action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* TARJETA DE CONTACTO */}
            <aside className="premium-card rounded-[2rem] p-6 sm:p-7 md:p-8">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                    Samora Studio
                  </p>

                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
                    Información de contacto
                  </h2>
                </div>

                <div className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/45 sm:block">
                  Colombia
                </div>
              </div>

              <div className="mt-8 space-y-6 text-sm sm:text-base">
                <Info label="WhatsApp" value="+57 319 270 9536" />
                <Info
                  label="Correo"
                  value="samoraestudiocreativo@gmail.com"
                />
                <Info label="Ubicación" value="Colombia" />
                <Info
                  label="Horario"
                  value="Lunes a sábado · 9:00 a.m. - 6:00 p.m."
                />
              </div>

              <div className="mt-8 grid gap-3">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                >
                  Iniciar conversación
                </a>

                <Link
                  href="/seguimiento"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium text-white/70 transition hover:border-white/35 hover:text-white"
                >
                  Consultar seguimiento
                </Link>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-sm leading-6 text-white/45">
                  Para una atención más rápida, cuéntanos qué tipo de servicio
                  necesitas, la fecha aproximada, el lugar y si buscas entrega
                  digital, impresa o ambas.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-white/35">{label}</p>
      <p className="mt-1 break-words font-medium text-white">{value}</p>
    </div>
  );
}