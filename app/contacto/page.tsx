import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const whatsappNumber =
  process.env.NEXT_PUBLIC_SAMORA_WHATSAPP_NUMBER ?? "573138429568";

const whatsappText =
  "Hola, quiero comunicarme con Samora Estudio para consultar información sobre sus servicios.";

const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
  whatsappText
)}`;

export const metadata: Metadata = {
  title: "Contacto | Samora Estudio",
  description:
    "Contacta a Samora Estudio para cotizar sesiones, eventos, fotografía de producto, impresiones, entregas y pedidos.",
  alternates: {
    canonical: "/contacto",
  },
  openGraph: {
    title: "Contacto | Samora Estudio",
    description:
      "Escríbenos para consultar disponibilidad, solicitar una cotización personalizada o resolver dudas sobre productos y entregas.",
    url: "/contacto",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Contacto Samora Estudio",
      },
    ],
  },
};

const quickActions = [
  {
    label: "Cotizar una sesión",
    href: "/servicios#cotizador",
  },
  {
    label: "Consultar disponibilidad",
    href: whatsappLink,
  },
  {
    label: "Preguntar por productos impresos",
    href: "/tienda",
  },
  {
    label: "Seguimiento de entrega",
    href: "/seguimiento",
  },
];

export default function ContactoPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className="animate-fade-up">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Contacto
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.05] tracking-[-0.05em] sm:text-5xl md:text-7xl">
              Hablemos de tu próxima historia, evento o producto.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
              Escríbenos para consultar disponibilidad, solicitar una
              cotización personalizada, planear la cobertura de un evento o
              resolver dudas sobre productos impresos, entregas y pedidos.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <Link
                href="/servicios#cotizador"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
              >
                Realizar cotización
              </Link>

              <Link
                href="/servicios"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-7 py-3 text-sm font-medium text-white/70 transition hover:border-white/35 hover:bg-white hover:text-black"
              >
                Ver productos y servicios
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {quickActions.map((action) => {
                const isExternal = action.href.startsWith("http");

                if (isExternal) {
                  return (
                    <a
                      key={action.label}
                      href={action.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/55 transition hover:border-white/25 hover:text-white"
                    >
                      {action.label}
                    </a>
                  );
                }

                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/55 transition hover:border-white/25 hover:text-white"
                  >
                    {action.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <aside className="premium-card rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                Samora Estudio
              </p>

              <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/45">
                Colombia
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.04em]">
              Información de contacto
            </h2>

            <div className="mt-8 space-y-6">
              <InfoBlock label="WhatsApp" value="+57 313 842 9568" />
              <InfoBlock
                label="Correo"
                value="samoraestudiocreativo@gmail.com"
              />
              <InfoBlock label="Ubicación" value="Guatavita, Cundinamarca" />
              <InfoBlock
                label="Horario"
                value="Lunes a sábado · 9:00 a.m. - 6:00 p.m."
              />
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
            >
              Iniciar conversación
            </a>

            <Link
              href="/seguimiento"
              className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 px-7 py-3 text-sm font-medium text-white/65 transition hover:border-white/35 hover:text-white"
            >
              Consultar seguimiento
            </Link>

            <div className="mt-8 border-t border-white/10 pt-6">
              <p className="text-sm leading-7 text-white/45">
                Para una atención más rápida, cuéntanos qué tipo de servicio
                necesitas, fecha aproximada, lugar, entregables y si prefieres
                coordinar una reunión virtual, presencial o continuar por
                WhatsApp.
              </p>
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-white/35">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}