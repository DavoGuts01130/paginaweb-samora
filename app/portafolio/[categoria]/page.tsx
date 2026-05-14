import Link from "next/link";
import Navbar from "@/components/Navbar";

const portfolioData: Record<
  string,
  {
    title: string;
    description: string;
    projects: {
      title: string;
      description: string;
      href: string;
      image: string;
    }[];
  }
> = {
  retratos: {
    title: "Retratos",
    description:
      "Sesiones enfocadas en identidad, expresión y estilo personal, con una dirección visual elegante y auténtica.",
    projects: [
      {
        title: "Retrato editorial Sofía",
        description: "Una sesión íntima con luz suave y composición minimalista.",
        href: "/portafolio/retratos/retrato-editorial-sofia",
        image:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80",
      },
      {
        title: "Retrato urbano Daniel",
        description: "Una propuesta moderna en exteriores con enfoque lifestyle.",
        href: "/portafolio/retratos/retrato-urbano-daniel",
        image:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  "eventos-especiales": {
    title: "Eventos especiales",
    description:
      "Coberturas visuales para bodas, celebraciones y ocasiones memorables tratadas como proyectos editoriales.",
    projects: [
      {
        title: "Boda de Juana y Pepe",
        description: "Una celebración íntima al aire libre con estilo elegante y natural.",
        href: "/portafolio/eventos-especiales/boda-juana-pepe",
        image:
          "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
      },
      {
        title: "Cumpleaños de Mariana",
        description: "Una sesión llena de color, emoción y momentos espontáneos.",
        href: "/portafolio/eventos-especiales/cumpleanos-mariana",
        image:
          "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  "fotografia-de-producto": {
    title: "Fotografía de producto",
    description:
      "Imágenes pensadas para marcas, catálogos y contenido comercial con composición limpia y alta presencia visual.",
    projects: [
      {
        title: "Catálogo café Samora",
        description: "Fotografía de producto para redes, catálogo y tienda.",
        href: "/portafolio/fotografia-de-producto/catalogo-cafe-samora",
        image:
          "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
      },
      {
        title: "Colección cosmética Aura",
        description: "Proyecto visual para presentación de línea premium.",
        href: "/portafolio/fotografia-de-producto/coleccion-cosmetica-aura",
        image:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  "sesion-de-pareja": {
    title: "Sesión de pareja",
    description:
      "Historias visuales enfocadas en conexión, naturalidad y una estética emocional.",
    projects: [
      {
        title: "Laura y Andrés",
        description: "Sesión exterior con tonos cálidos y narrativa romántica.",
        href: "/portafolio/sesion-de-pareja/laura-y-andres",
        image:
          "https://images.unsplash.com/photo-1516589091380-5d60137c1d9e?auto=format&fit=crop&w=1200&q=80",
      },
      {
        title: "Camila y Mateo",
        description: "Una sesión íntima y elegante de estilo cinematográfico.",
        href: "/portafolio/sesion-de-pareja/camila-y-mateo",
        image:
          "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  fotodocumento: {
    title: "Fotodocumento",
    description:
      "Servicios de fotografía para documentos con presentación clara, precisa y profesional.",
    projects: [
      {
        title: "Fotodocumento pasaporte",
        description: "Ejemplo de resultado con iluminación uniforme y fondo adecuado.",
        href: "/portafolio/fotodocumento/pasaporte",
        image:
          "https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
  "fotos-con-marco": {
    title: "Fotos con marco",
    description:
      "Presentaciones impresas en distintos formatos para conservar recuerdos de forma elegante.",
    projects: [
      {
        title: "Marco 20x30 clásico",
        description: "Ejemplo de fotografía impresa y enmarcada para decoración.",
        href: "/portafolio/fotos-con-marco/marco-20x30-clasico",
        image:
          "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
      },
    ],
  },
};

export default async function CategoriaPage({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria } = await params;
  const data = portfolioData[categoria];

  if (!data) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-black pt-24 text-white">
          <section className="mx-auto max-w-6xl px-6 py-12">
            <Link
              href="/portafolio"
              className="text-sm text-neutral-400 transition hover:text-white"
            >
              ← Volver al portafolio
            </Link>
            <h1 className="mt-6 text-4xl font-bold">Categoría no encontrada</h1>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-6 py-12">
          <Link
            href="/portafolio"
            className="text-sm text-neutral-400 transition hover:text-white"
          >
            ← Volver al portafolio
          </Link>

          <div className="mt-6 max-w-3xl">
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-400">
              Categoría
            </p>
            <h1 className="mt-4 text-4xl font-bold md:text-6xl">{data.title}</h1>
            <p className="mt-6 text-lg text-neutral-300">{data.description}</p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {data.projects.map((project) => (
              <Link
                key={project.title}
                href={project.href}
                className="group overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 transition hover:-translate-y-1"
              >
                <div className="h-80 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  />
                </div>

                <div className="p-6">
                  <h2 className="text-2xl font-semibold">{project.title}</h2>
                  <p className="mt-3 text-neutral-400">{project.description}</p>
                  <span className="mt-5 inline-block text-sm text-white">
                    Ver proyecto →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}