import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Conoce Samora Estudio, un estudio fotográfico enfocado en crear imágenes con intención, emoción y permanencia para personas, marcas y recuerdos especiales.",
  alternates: {
    canonical: "/nosotros",
  },
  openGraph: {
    title: "Nosotros | Samora Estudio",
    description:
      "Creamos imágenes con intención, emoción y permanencia. Fotografía profesional con estética elegante y contemporánea.",
    url: "/nosotros",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Samora Estudio",
      },
    ],
  },
};

const OWNER_JILLY_IMAGE = "/samora-team/owner-1.png";
const OWNER_SAMANTHA_IMAGE = "/samora-team/owner-2.png";

const values = [
  {
    title: "Estética limpia",
    description:
      "Cuidamos la luz, la composición y el color para que cada imagen tenga presencia y coherencia visual.",
  },
  {
    title: "Atención cercana",
    description:
      "Acompañamos cada proyecto con una comunicación clara, humana y personalizada.",
  },
  {
    title: "Detalle en la entrega",
    description:
      "Pensamos no solo en tomar la fotografía, sino en cómo se edita, se organiza y se entrega.",
  },
  {
    title: "Memoria con intención",
    description:
      "Buscamos que cada imagen conserve una emoción, una historia o un valor especial.",
  },
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

const process = [
  "Escuchamos la idea",
  "Diseñamos la propuesta",
  "Capturamos la historia",
  "Editamos con intención",
  "Entregamos con cuidado",
];

const outlineButtonClass =
  "inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm font-medium !text-white/70 transition hover:border-white hover:bg-white hover:!text-black";

export default function NosotrosPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
            <div className="animate-fade-up">
              <p className="text-xs uppercase tracking-[0.35em] text-white/35 sm:text-sm">
                Nosotros
              </p>

              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-[0.98] tracking-[-0.05em] sm:text-5xl md:text-6xl lg:text-7xl">
                Un estudio fotográfico creado para capturar imágenes con
                intención.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/55 sm:text-lg sm:leading-8">
                Samora Estudio nace como una propuesta visual enfocada en
                capturar momentos auténticos y transformarlos en recuerdos
                duraderos. Cada sesión, evento o producto se trabaja con
                estética, cuidado y una mirada cercana.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/portafolio"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium !text-black transition hover:scale-[1.02] hover:!text-black"
                >
                  Ver portafolio
                </Link>

                <Link href="/contacto" className={outlineButtonClass}>
                  Hablemos de tu proyecto
                </Link>
              </div>
            </div>

            <div className="relative min-h-[560px] overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950 lg:min-h-[620px]">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-35"
                style={{
                  backgroundImage:
                    "linear-gradient(to top, rgba(0,0,0,0.96), rgba(0,0,0,0.35), rgba(0,0,0,0.78)), url('/nosotros-samora.jpg')",
                }}
              />

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.18),transparent_30%),radial-gradient(circle_at_78%_78%,rgba(255,255,255,0.1),transparent_34%)]" />

              <div className="relative z-10 flex h-full min-h-[560px] flex-col justify-between gap-8 p-6 sm:p-8 lg:min-h-[620px]">
                <div className="flex items-center justify-between gap-4">
                  <span className="rounded-full border border-white/15 bg-black/45 px-4 py-2 text-[0.65rem] uppercase tracking-[0.28em] text-white/70 backdrop-blur-md">
                    Samora Estudio
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[0.65rem] uppercase tracking-[0.25em] text-white/45">
                    Fotografía & diseño
                  </span>
                </div>

                <div className="mx-auto grid w-full max-w-xl gap-7">
                  <div className="text-center sm:text-left">
                    <p className="font-serif text-5xl italic leading-none tracking-[-0.06em] text-white sm:text-6xl">
                      Jilly &
                      <br />
                      Samantha
                    </p>

                    <p className="mt-5 text-xs uppercase tracking-[0.32em] text-white/45">
                      Dirección visual · Fotografía · Memoria
                    </p>

                    <p className="mt-5 max-w-lg text-sm leading-6 text-white/58 sm:text-base sm:leading-7">
                      Detrás de Samora Estudio hay una mirada cercana, sensible
                      y cuidadosa: una forma de crear imágenes que no solo se ven
                      bien, sino que conservan una historia, una emoción y una
                      intención.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <OwnerCard
                      image={OWNER_JILLY_IMAGE}
                      role="Fotógrafo"
                      name="Jilly"
                      imageStyle={{
                        objectPosition: "center center",
                      }}
                    />

                    <OwnerCard
                      image={OWNER_SAMANTHA_IMAGE}
                      role="Fotógrafa"
                      name="Samantha"
                      portraitMode
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md">
                    <p className="text-2xl font-semibold">01</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/45">
                      Intención
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md">
                    <p className="text-2xl font-semibold">02</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/45">
                      Captura
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md">
                    <p className="text-2xl font-semibold">03</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/45">
                      Entrega
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-5">
            {values.map((value) => (
              <article
                key={value.title}
                className="premium-card premium-card-hover rounded-[1.5rem] p-5 sm:p-6"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-white/30">
                  Valor
                </p>

                <h3 className="mt-4 text-xl font-semibold tracking-[-0.02em]">
                  {value.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/50">
                  {value.description}
                </p>
              </article>
            ))}
          </div>

          <section className="mt-16 grid gap-8 border-t border-white/10 pt-14 lg:mt-24 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:pt-20">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/35 sm:text-sm">
                Filosofía
              </p>

              <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">
                No se trata solo de tomar fotografías, sino de construir
                recuerdos con valor.
              </h2>
            </div>

            <div className="space-y-6 text-base leading-7 text-white/55 sm:text-lg sm:leading-8">
              <p>
                Cada proyecto se piensa desde la experiencia del cliente: cómo
                se vive, cómo se recuerda y cómo permanece en el tiempo. Por eso
                cuidamos la preparación, la captura, la edición y la entrega
                final.
              </p>

              <p>
                Trabajamos con personas, familias, marcas y eventos que buscan
                algo más que una imagen bonita: buscan una pieza visual que
                comunique, emocione y conserve un momento importante.
              </p>
            </div>
          </section>

          <section className="mt-16 lg:mt-24">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/35 sm:text-sm">
                  Lo que hacemos
                </p>

                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
                  Fotografía para historias, marcas y recuerdos especiales.
                </h2>
              </div>

              <Link
                href="/servicios"
                className="w-fit rounded-full border border-white/15 px-5 py-3 text-sm !text-white/60 transition hover:border-white hover:bg-white hover:!text-black"
              >
                Ver servicios →
              </Link>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {services.map((service) => (
                <article
                  key={service.title}
                  className="group rounded-[1.75rem] border border-white/10 bg-neutral-950 p-6 transition hover:border-white/25"
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

          <section className="mt-16 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8 lg:mt-24 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/35 sm:text-sm">
                  Proceso
                </p>

                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                  Una experiencia visual organizada de inicio a fin.
                </h2>

                <p className="mt-5 text-sm leading-6 text-white/50 sm:text-base sm:leading-7">
                  Desde la primera conversación hasta la entrega final, buscamos
                  que cada cliente entienda el proceso y se sienta acompañado.
                </p>
              </div>

              <div className="grid gap-3">
                {process.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/35 p-4"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <p className="text-sm text-white/65 sm:text-base">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="premium-card animate-soft-scale mt-16 rounded-[2rem] p-6 text-center sm:p-8 md:p-12 lg:mt-24">
            <p className="text-xs uppercase tracking-[0.35em] text-white/35 sm:text-sm">
              Samora Estudio
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
              Cada historia merece una imagen pensada con intención.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/50 sm:text-base sm:leading-7">
              Cuéntanos qué quieres recordar, mostrar o construir visualmente.
              Podemos ayudarte a convertirlo en una experiencia fotográfica.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/contacto"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-medium !text-black transition hover:scale-[1.02] hover:!text-black"
              >
                Contactar a Samora
              </Link>

              <Link href="/portafolio" className={outlineButtonClass}>
                Explorar trabajos
              </Link>
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

function OwnerCard({
  image,
  role,
  name,
  imageStyle,
  portraitMode = false,
}: {
  image: string;
  role: string;
  name: string;
  imageStyle?: CSSProperties;
  portraitMode?: boolean;
}) {
  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/55 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md transition hover:border-white/25">
      <div className="relative aspect-square overflow-hidden bg-neutral-900">
        {portraitMode ? (
          <>
            <img
              src={image}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-xl transition duration-500 group-hover:scale-[1.14]"
              style={{
                objectPosition: "center center",
              }}
            />

            <img
              src={image}
              alt={`${name}, ${role.toLowerCase()} de Samora Estudio`}
              className="relative z-10 mx-auto h-full w-full object-contain transition duration-500 group-hover:scale-[1.03]"
              style={{
                transform: "translateY(-32px) scale(1.1)",
                ...imageStyle,
              }}
            />
          </>
        ) : (
          <img
            src={image}
            alt={`${name}, ${role.toLowerCase()} de Samora Estudio`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            style={imageStyle}
          />
        )}
      </div>

      <div className="border-t border-white/10 p-4">
        <p className="text-[0.65rem] uppercase tracking-[0.32em] text-white/35">
          {role}
        </p>

        <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-white">
          {name}
        </h3>
      </div>
    </article>
  );
}