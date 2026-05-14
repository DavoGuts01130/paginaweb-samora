import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProjectGallery from "@/components/ProjectGallery";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProjectPageProps = {
  params: Promise<{
    categoria: string;
    proyecto: string;
  }>;
};

type ProjectQueryResult = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  year: string | null;
  client: string | null;
  cover_image: string | null;
  portfolio_categories:
    | {
        name: string;
        slug: string;
      }
    | {
        name: string;
        slug: string;
      }[]
    | null;
  portfolio_images:
    | {
        image_url: string;
        position: number | null;
      }[]
    | null;
};

function getImageHeights(count: number) {
  const pattern = [
    "h-[340px] md:h-[520px]",
    "h-[300px] md:h-[360px]",
    "h-[360px] md:h-[460px]",
    "h-[300px] md:h-[340px]",
    "h-[380px] md:h-[500px]",
    "h-[320px] md:h-[390px]",
  ];

  return Array.from(
    { length: count },
    (_, index) => pattern[index % pattern.length]
  );
}

export default async function ProyectoPage({ params }: ProjectPageProps) {
  const { categoria, proyecto } = await params;

  const { data, error } = await supabase
    .from("portfolio_projects")
    .select(
      `
      id,
      title,
      slug,
      description,
      year,
      client,
      cover_image,
      portfolio_categories (
        name,
        slug
      ),
      portfolio_images (
        image_url,
        position
      )
    `
    )
    .eq("slug", proyecto)
    .single<ProjectQueryResult>();

  if (error || !data) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-black pt-24 text-white">
          <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
            <Link
              href="/portafolio"
              className="text-sm text-neutral-400 transition hover:text-white"
            >
              ← Volver al portafolio
            </Link>

            <div className="premium-card mt-8 rounded-[1.5rem] p-8">
              <h1 className="text-4xl font-bold">Proyecto no encontrado</h1>

              {error && (
                <p className="mt-4 text-sm text-red-400">
                  Error: {error.message}
                </p>
              )}
            </div>
          </section>
        </main>
      </>
    );
  }

  const category = Array.isArray(data.portfolio_categories)
    ? data.portfolio_categories[0]
    : data.portfolio_categories;

  if (!category || category.slug !== categoria) {
    return (
      <>
        <Navbar />

        <main className="min-h-screen bg-black pt-24 text-white">
          <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
            <Link
              href="/portafolio"
              className="text-sm text-neutral-400 transition hover:text-white"
            >
              ← Volver al portafolio
            </Link>

            <div className="premium-card mt-8 rounded-[1.5rem] p-8">
              <h1 className="text-4xl font-bold">
                La categoría no coincide con el proyecto
              </h1>
            </div>
          </section>
        </main>
      </>
    );
  }

  const sortedImages =
    data.portfolio_images
      ?.slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) ?? [];

  const gallerySourceImages =
    sortedImages.length > 0
      ? sortedImages.map((image) => image.image_url)
      : data.cover_image
      ? [data.cover_image]
      : [];

  const heights = getImageHeights(gallerySourceImages.length);

  const galleryImages = gallerySourceImages.map((src, index) => ({
    src,
    alt: `${data.title} ${index + 1}`,
    height: heights[index],
  }));

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
          <Link
            href="/portafolio"
            className="text-sm text-neutral-400 transition hover:text-white"
          >
            ← Volver al portafolio
          </Link>

          <div className="mt-8 max-w-5xl md:mt-10">
            <p className="text-sm uppercase tracking-[0.35em] text-neutral-500">
              {category.name}
            </p>

            <h1 className="mt-4 text-4xl font-bold leading-[1.05] tracking-[-0.04em] sm:text-5xl md:text-6xl xl:text-7xl">
              {data.title}
            </h1>

            <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 text-sm sm:flex sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-3">
              <InfoMeta label="Cliente" value={data.client ?? "Samora Studio"} />
              <Separator />
              <InfoMeta label="Año" value={data.year ?? "2026"} />
              <Separator />
              <InfoMeta label="Tipo" value={category.name} />
            </div>

            <p className="mt-8 max-w-3xl text-base leading-7 text-neutral-400 md:text-xl md:leading-8">
              {data.description ??
                "Proyecto visual desarrollado por Samora Studio."}
            </p>
          </div>

          {data.cover_image && (
            <div className="mt-10 overflow-hidden rounded-[1.75rem] border border-white/10 md:mt-14 md:rounded-[2rem]">
              <img
                src={data.cover_image}
                alt={data.title}
                className="h-[360px] w-full object-cover sm:h-[430px] md:h-[55vh]"
              />
            </div>
          )}

          {galleryImages.length > 0 && (
            <ProjectGallery images={galleryImages} />
          )}

          <div className="premium-card mt-16 rounded-[2rem] p-6 text-center sm:p-8 md:mt-20 md:p-12">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Samora Studio
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
              ¿Quieres una sesión con esta misma intención visual?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-white/50">
              Podemos crear una experiencia fotográfica adaptada a tu estilo,
              marca o recuerdo especial.
            </p>

            <Link
              href="/contacto"
              className="premium-button mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
            >
              Solicitar información
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

function InfoMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
        {label}
      </span>
      <span className="break-words text-white">{value}</span>
    </div>
  );
}

function Separator() {
  return <div className="hidden h-4 w-px bg-white/10 sm:block" />;
}