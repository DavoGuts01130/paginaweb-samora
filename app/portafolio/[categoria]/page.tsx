import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean | null;
};

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string | null;
  position?: number | null;
  is_active?: boolean | null;
};

type Project = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  cover_image: string | null;
  category_id: string;
  subcategory_id?: string | null;
  client?: string | null;
  year?: string | number | null;
  display_order?: number | null;
  image_fit?: string | null;
  image_zoom?: number | null;
  image_x?: number | null;
  image_y?: number | null;
};

type PageProps = {
  params: Promise<{ categoria: string }>;
  searchParams?: Promise<{ subcategoria?: string }>;
};

function getImageStyle(project: Project): CSSProperties {
  return {
    objectFit: project.image_fit === "contain" ? "contain" : "cover",
    objectPosition: `${Number(project.image_x ?? 50)}% ${Number(
      project.image_y ?? 50
    )}%`,
    transform: `scale(${Number(project.image_zoom ?? 1)})`,
  };
}

function getImageHeight(index: number) {
  const heights = [
    "h-[380px] md:h-[620px]",
    "h-[320px] md:h-[480px]",
    "h-[360px] md:h-[540px]",
    "h-[300px] md:h-[440px]",
  ];

  return heights[index % heights.length];
}

function ProjectCard({
  project,
  category,
  subcategory,
  index,
  single = false,
}: {
  project: Project;
  category: Category;
  subcategory?: Subcategory;
  index: number;
  single?: boolean;
}) {
  if (!project.cover_image) return null;

  return (
    <Link
      href={`/portafolio/${category.slug}/${project.slug}`}
      className="group block break-inside-avoid"
    >
      <article className="premium-card premium-card-hover overflow-hidden rounded-[1.75rem]">
        <div
          className={`relative overflow-hidden ${
            single ? "h-[360px] md:h-[620px]" : getImageHeight(index)
          }`}
        >
          <Image
            src={project.cover_image}
            alt={project.title}
            fill
            sizes={
              single
                ? "(max-width: 768px) 100vw, 70vw"
                : "(max-width: 768px) 100vw, 50vw"
            }
            className="image-premium"
            style={getImageStyle(project)}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 opacity-95 transition duration-500 group-hover:opacity-100" />

          <div className="absolute left-4 top-4 max-w-[calc(100%-2rem)] rounded-full border border-white/15 bg-black/55 px-4 py-2 text-[0.62rem] uppercase tracking-[0.22em] text-white/75 backdrop-blur-md sm:left-5 sm:top-5">
            <span>{category.name}</span>
            {subcategory?.name && <span> · {subcategory.name}</span>}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <h2 className="text-2xl font-semibold tracking-tight drop-shadow">
              {project.title}
            </h2>

            {(project.client || project.year) && (
              <p className="mt-2 text-sm text-white/55">
                {[project.client, project.year].filter(Boolean).join(" · ")}
              </p>
            )}

            {project.description && (
              <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-6 text-white/55">
                {project.description}
              </p>
            )}

            <span className="mt-5 inline-flex rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm text-white/75 backdrop-blur-sm transition duration-500 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
              Ver proyecto →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default async function CategoriaPage({
  params,
  searchParams,
}: PageProps) {
  const { categoria } = await params;
  const query = searchParams ? await searchParams : {};
  const selectedSubcategorySlug = query?.subcategoria ?? "";

  const { data: category, error: categoryError } = await supabase
    .from("portfolio_categories")
    .select("id, name, slug, description, is_active")
    .eq("slug", categoria)
    .single<Category>();

  if (categoryError || !category || category.is_active === false) {
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
              <h1 className="text-4xl font-bold">Categoría no encontrada</h1>

              <p className="mt-4 text-neutral-400">
                Esta colección no existe o no está disponible por el momento.
              </p>
            </div>
          </section>
        </main>
      </>
    );
  }

  const { data: subcategories } = await supabase
    .from("portfolio_subcategories")
    .select("id, category_id, name, slug, description, position, is_active")
    .eq("category_id", category.id)
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const activeSubcategories =
    (subcategories as Subcategory[] | null)?.filter(
      (subcategory) => subcategory.is_active !== false
    ) ?? [];

  const selectedSubcategory = activeSubcategories.find(
    (subcategory) => subcategory.slug === selectedSubcategorySlug
  );

  const { data: projects, error: projectsError } = await supabase
    .from("portfolio_projects")
    .select(
      `
      id,
      title,
      slug,
      description,
      cover_image,
      category_id,
      subcategory_id,
      client,
      year,
      display_order,
      image_fit,
      image_zoom,
      image_x,
      image_y
    `
    )
    .eq("category_id", category.id)
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const allProjects = ((projects as Project[] | null) ?? []).filter(
    (project) => Boolean(project.cover_image)
  );

  const visibleProjects = selectedSubcategory
    ? allProjects.filter(
        (project) => project.subcategory_id === selectedSubcategory.id
      )
    : allProjects;

  const groupedSections = selectedSubcategory
    ? [
        {
          id: selectedSubcategory.id,
          title: selectedSubcategory.name,
          description: selectedSubcategory.description,
          projects: visibleProjects,
          subcategory: selectedSubcategory,
        },
      ]
    : [
        ...activeSubcategories
          .map((subcategory) => ({
            id: subcategory.id,
            title: subcategory.name,
            description: subcategory.description,
            projects: allProjects.filter(
              (project) => project.subcategory_id === subcategory.id
            ),
            subcategory,
          }))
          .filter((section) => section.projects.length > 0),
        {
          id: "sin-subcategoria",
          title: "Otros proyectos",
          description: null,
          projects: allProjects.filter((project) => !project.subcategory_id),
          subcategory: undefined,
        },
      ].filter((section) => section.projects.length > 0);

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

          <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/35">
                Colección
              </p>

              <h1 className="mt-4 text-5xl font-bold leading-[0.95] tracking-[-0.05em] sm:text-6xl md:text-8xl">
                {category.name}
              </h1>
            </div>

            <div className="max-w-2xl lg:justify-self-end">
              <p className="text-base leading-7 text-white/55 md:text-lg md:leading-8">
                {selectedSubcategory?.description ??
                  category.description ??
                  "Una selección de proyectos visuales organizados por intención, estilo y tipo de experiencia fotográfica."}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <p className="text-sm text-white/35">
                  {visibleProjects.length} proyecto
                  {visibleProjects.length === 1 ? "" : "s"}
                </p>

                {selectedSubcategory && (
                  <span className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/60">
                    Mostrando: {selectedSubcategory.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {activeSubcategories.length > 0 && (
            <div className="mt-12">
              <p className="mb-4 text-xs uppercase tracking-[0.35em] text-white/30">
                Filtrar por subcategoría
              </p>

              <div className="flex gap-3 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible md:pb-0">
                <Link
                  href={`/portafolio/${category.slug}`}
                  className={`shrink-0 rounded-full border px-5 py-2 text-sm transition ${
                    !selectedSubcategory
                      ? "border-white bg-white text-black"
                      : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white"
                  }`}
                >
                  Todos
                </Link>

                {activeSubcategories.map((subcategory) => {
                  const active = selectedSubcategory?.id === subcategory.id;

                  return (
                    <Link
                      key={subcategory.id}
                      href={`/portafolio/${category.slug}?subcategoria=${subcategory.slug}`}
                      className={`shrink-0 rounded-full border px-5 py-2 text-sm transition ${
                        active
                          ? "border-white bg-white text-black"
                          : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      {subcategory.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {projectsError && (
            <div className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              Error cargando proyectos: {projectsError.message}
            </div>
          )}

          {visibleProjects.length === 0 ? (
            <div className="premium-card mt-12 rounded-[1.5rem] p-8">
              <h2 className="text-3xl font-semibold">
                Aún no hay proyectos en esta selección.
              </h2>

              <p className="mt-4 text-white/45">
                Puedes volver a la colección completa o probar otra
                subcategoría.
              </p>
            </div>
          ) : (
            <div className="mt-10 space-y-14 md:mt-12 md:space-y-16">
              {groupedSections.map((section) => (
                <section key={section.id}>
                  <div className="mb-6 flex flex-col gap-3 md:mb-8 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-white/30">
                        {selectedSubcategory ? "Selección" : "Subcategoría"}
                      </p>

                      <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] md:text-5xl">
                        {section.title}
                      </h2>

                      {section.description && (
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45 md:text-base">
                          {section.description}
                        </p>
                      )}
                    </div>

                    <p className="text-sm text-white/35">
                      {section.projects.length} proyecto
                      {section.projects.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div
                    className={
                      section.projects.length === 1
                        ? "grid max-w-5xl"
                        : "grid gap-6 md:block md:columns-2 md:space-y-6"
                    }
                  >
                    {section.projects.map((project, index) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        category={category}
                        subcategory={section.subcategory}
                        index={index}
                        single={section.projects.length === 1}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}