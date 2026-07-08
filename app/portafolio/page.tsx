import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import FeaturedProjectsCarousel from "@/components/FeaturedProjectsCarousel";
import { supabase } from "@/lib/supabase";
import type { CSSProperties } from "react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Portafolio de fotografía",
  description:
    "Explora el portafolio de Samora Studio: retratos, eventos, productos y proyectos visuales creados con estética, emoción e intención.",
  alternates: {
    canonical: "/portafolio",
  },
  openGraph: {
    title: "Portafolio | Samora Studio",
    description:
      "Una selección de trabajos fotográficos donde la estética, la emoción y la narrativa visual se unen.",
    url: "/portafolio",
    images: [
      {
        url: "/og-portafolio.jpg",
        width: 1200,
        height: 630,
        alt: "Portafolio Samora Studio",
      },
    ],
  },
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  position?: number | null;
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
  cover_image: string | null;
  category_id: string;
  subcategory_id?: string | null;
  client?: string | null;
  year?: string | number | null;
  is_featured?: boolean | null;
  display_order?: number | null;
  image_fit?: string | null;
  image_zoom?: number | null;
  image_x?: number | null;
  image_y?: number | null;
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
    "h-[360px] md:h-[620px]",
    "h-[320px] md:h-[480px]",
    "h-[380px] md:h-[560px]",
    "h-[300px] md:h-[440px]",
  ];

  return heights[index % heights.length];
}

function getProjectSubcategory(
  project: Project,
  subcategories: Subcategory[]
) {
  return subcategories.find(
    (subcategory) => subcategory.id === project.subcategory_id
  );
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
            single ? "h-[360px] md:h-[560px]" : getImageHeight(index)
          }`}
        >
          <Image
            src={project.cover_image}
            alt={project.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="image-premium"
            style={getImageStyle(project)}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 opacity-95 transition duration-500 group-hover:opacity-100" />

          <div className="absolute left-4 top-4 max-w-[calc(100%-2rem)] rounded-full border border-white/15 bg-black/50 px-4 py-2 text-[0.62rem] uppercase tracking-[0.22em] text-white/75 backdrop-blur-md sm:left-5 sm:top-5">
            <span>{category.name}</span>
            {subcategory?.name && <span> · {subcategory.name}</span>}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
            <h3 className="text-2xl font-semibold tracking-tight drop-shadow">
              {project.title}
            </h3>

            {(project.client || project.year) && (
              <p className="mt-2 text-sm text-white/55">
                {[project.client, project.year].filter(Boolean).join(" · ")}
              </p>
            )}

            <div className="mt-5 inline-flex rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm text-white/75 backdrop-blur-sm transition duration-500 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100">
              Explorar proyecto →
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default async function PortafolioPage() {
  const { data: categories, error: categoriesError } = await supabase
    .from("portfolio_categories")
    .select("id, name, slug, description, position, is_active")
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const { data: subcategories, error: subcategoriesError } = await supabase
    .from("portfolio_subcategories")
    .select("id, category_id, name, slug, description, position, is_active")
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const { data: projects, error: projectsError } = await supabase
    .from("portfolio_projects")
    .select(
      `
      id,
      title,
      slug,
      cover_image,
      category_id,
      subcategory_id,
      client,
      year,
      is_featured,
      display_order,
      image_fit,
      image_zoom,
      image_x,
      image_y
    `
    )
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const activeCategories =
    (categories as Category[] | null)?.filter(
      (category) => category.is_active !== false
    ) ?? [];

  const activeSubcategories =
    (subcategories as Subcategory[] | null)?.filter(
      (subcategory) => subcategory.is_active !== false
    ) ?? [];

  const allProjects = ((projects as Project[] | null) ?? []).filter(
    (project) => Boolean(project.cover_image)
  );

  const featuredProjects =
    allProjects
      .filter((project) => project.is_featured)
      .slice(0, 4)
      .map((project) => {
        const category = activeCategories.find(
          (item) => item.id === project.category_id
        );

        const subcategory = getProjectSubcategory(
          project,
          activeSubcategories
        );

        return {
          id: project.id,
          title: project.title,
          slug: project.slug,
          cover_image: project.cover_image ?? "",
          categoryName: category?.name ?? "Portafolio",
          categorySlug: category?.slug ?? "",
          subcategoryName: subcategory?.name ?? null,
          client: project.client ?? null,
          year: project.year ?? null,
          image_fit: project.image_fit ?? null,
          image_zoom: project.image_zoom ?? null,
          image_x: project.image_x ?? null,
          image_y: project.image_y ?? null,
        };
      }) ?? [];

  const fallbackFeaturedProjects =
    allProjects
      .slice(0, 4)
      .map((project) => {
        const category = activeCategories.find(
          (item) => item.id === project.category_id
        );

        const subcategory = getProjectSubcategory(
          project,
          activeSubcategories
        );

        return {
          id: project.id,
          title: project.title,
          slug: project.slug,
          cover_image: project.cover_image ?? "",
          categoryName: category?.name ?? "Portafolio",
          categorySlug: category?.slug ?? "",
          subcategoryName: subcategory?.name ?? null,
          client: project.client ?? null,
          year: project.year ?? null,
          image_fit: project.image_fit ?? null,
          image_zoom: project.image_zoom ?? null,
          image_x: project.image_x ?? null,
          image_y: project.image_y ?? null,
        };
      }) ?? [];

  const carouselProjects =
    featuredProjects.length > 0 ? featuredProjects : fallbackFeaturedProjects;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="animate-fade-up">
              <p className="text-sm uppercase tracking-[0.35em] text-white/35 md:tracking-[0.4em]">
                Samora Studio
              </p>

              <h1 className="mt-4 text-5xl font-bold leading-[0.95] tracking-[-0.05em] sm:text-6xl md:text-8xl">
                Portafolio
              </h1>
            </div>

            <p className="max-w-2xl text-base leading-7 text-white/55 md:text-lg md:leading-8 lg:justify-self-end">
              Una selección de trabajos donde la estética, la emoción y la
              narrativa visual se unen para conservar momentos con intención.
            </p>
          </div>

          <div className="mt-10 md:mt-12">
            <FeaturedProjectsCarousel projects={carouselProjects} />
          </div>

          {(categoriesError || subcategoriesError || projectsError) && (
            <div className="mt-10 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              {categoriesError && (
                <p>Error cargando categorías: {categoriesError.message}</p>
              )}
              {subcategoriesError && (
                <p>
                  Error cargando subcategorías: {subcategoriesError.message}
                </p>
              )}
              {projectsError && (
                <p>Error cargando proyectos: {projectsError.message}</p>
              )}
            </div>
          )}

          {activeCategories.length > 0 && (
            <div className="mt-12 md:mt-16">
              <p className="mb-4 text-xs uppercase tracking-[0.35em] text-white/30">
                Explorar colecciones
              </p>

              <div className="flex gap-3 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible md:pb-0">
                {activeCategories.map((category) => (
                  <a
                    key={category.id}
                    href={`#${category.slug}`}
                    className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-sm text-white/55 transition hover:border-white/25 hover:text-white"
                  >
                    {category.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-16 space-y-20 md:mt-20 md:space-y-24">
            {activeCategories.map((category) => {
              const categoryProjects = allProjects.filter(
                (project) => project.category_id === category.id
              );

              const categorySubcategories = activeSubcategories.filter(
                (subcategory) => subcategory.category_id === category.id
              );

              if (categoryProjects.length === 0) return null;

              return (
                <section key={category.id} id={category.slug}>
                  <div className="mb-8 flex flex-col gap-5 md:mb-10 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.35em] text-white/35">
                        Colección
                      </p>

                      <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] md:text-6xl">
                        {category.name}
                      </h2>

                      {category.description && (
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45 md:text-base">
                          {category.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-3 md:items-end">
                      <p className="text-sm text-white/40">
                        {categoryProjects.length} proyecto
                        {categoryProjects.length === 1 ? "" : "s"}
                      </p>

                      <Link
                        href={`/portafolio/${category.slug}`}
                        className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/60 transition hover:border-white/35 hover:text-white"
                      >
                        Ver colección →
                      </Link>
                    </div>
                  </div>

                  {categorySubcategories.length > 0 && (
                    <div className="mb-8 flex gap-2 overflow-x-auto pb-2 md:flex-wrap md:overflow-visible md:pb-0">
                      <Link
                        href={`/portafolio/${category.slug}`}
                        className="shrink-0 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.16em] text-white/55 transition hover:border-white/35 hover:text-white"
                      >
                        Todos
                      </Link>

                      {categorySubcategories.map((subcategory) => (
                        <Link
                          key={subcategory.id}
                          href={`/portafolio/${category.slug}?subcategoria=${subcategory.slug}`}
                          className="shrink-0 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.16em] text-white/45 transition hover:border-white/30 hover:text-white"
                        >
                          {subcategory.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div
                    className={
                      categoryProjects.length === 1
                        ? "grid max-w-3xl"
                        : "grid gap-6 md:block md:columns-2 md:space-y-6"
                    }
                  >
                    {categoryProjects.map((project, index) => {
                      const subcategory = getProjectSubcategory(
                        project,
                        activeSubcategories
                      );

                      return (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          category={category}
                          subcategory={subcategory}
                          index={index}
                          single={categoryProjects.length === 1}
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          <div className="premium-card animate-soft-scale mt-20 rounded-[2rem] p-6 text-center sm:p-8 md:mt-24 md:p-12">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Tu historia
            </p>

            <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.03em] md:text-4xl lg:text-5xl">
              ¿Quieres crear una sesión con esta misma intención visual?
            </h2>

            <p className="mx-auto mt-5 max-w-2xl leading-7 text-white/50">
              Podemos diseñar una experiencia fotográfica adaptada a tu estilo,
              ocasión o producto.
            </p>

            <Link
              href="/contacto"
              className="premium-button mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
            >
              Hablemos de tu proyecto
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}