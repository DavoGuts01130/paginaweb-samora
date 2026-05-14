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

export default function ContactoPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:gap-12">
            {/* CONTENIDO PRINCIPAL */}
            <div className="animate-fade-up">
              <p className="text-xs uppercase tracking-[0.35em] text-white/35 sm:text-sm">
                Contacto
              </p>

              <h1 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl md:text-6xl lg:text-7xl">
                Cotiza tu próxima sesión fotográfica con Samora Studio.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 sm:text-lg sm:leading-8">
                Escríbenos para consultar disponibilidad, solicitar información
                sobre servicios fotográficos, cotizar productos impresos o
                resolver dudas sobre entregas.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="premium-button inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-center text-sm font-medium text-black transition hover:scale-[1.02]"
                >
                  Escribir por WhatsApp
                </a>

                <Link
                  href="/tienda"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3 text-center text-sm text-white/75 transition hover:bg-white hover:text-black"
                >
                  Ver productos
                </Link>
              </div>
            </div>

            {/* TARJETA DE CONTACTO */}
            <aside className="premium-card rounded-[2rem] p-6 sm:p-7 md:p-8">
              <h2 className="text-2xl font-semibold sm:text-3xl">
                Información de contacto
              </h2>

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

              <div className="mt-8 rounded-2xl border border-white/10 bg-black p-4 sm:p-5">
                <p className="text-sm leading-6 text-white/45">
                  Esta información puede ajustarse fácilmente cuando Samora
                  defina el número, correo oficial, ciudad y horarios finales.
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