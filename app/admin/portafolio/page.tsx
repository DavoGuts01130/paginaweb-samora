import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    q?: string;
    categoria?: string;
    subcategoria?: string;
    destacado?: string;
    portada?: string;
  }>;
};

type Category = {
  id: string;
  name: string;
  slug: string;
  position: number | null;
  is_active: boolean | null;
};

type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  position: number | null;
  is_active: boolean | null;
};

type ProjectImage = {
  id: string;
};

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  year: string | null;
  client: string | null;
  cover_image: string | null;
  image_fit: string | null;
  image_zoom: number | null;
  image_x: number | null;
  image_y: number | null;
  is_featured: boolean | null;
  featured_order: number | null;
  display_order: number | null;
  portfolio_images: ProjectImage[] | null;
};

const inputClass =
  "min-h-12 w-full rounded-[0.9rem] border border-white/10 bg-black px-4 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-white/40 md:text-sm";

function getImageStyle(project: Project): CSSProperties {
  return {
    objectFit: project.image_fit === "contain" ? "contain" : "cover",
    objectPosition: `${Number(project.image_x ?? 50)}% ${Number(
      project.image_y ?? 50
    )}%`,
    transform: `scale(${Number(project.image_zoom ?? 1)})`,
  };
}

async function getAdminSupabase() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/");

  return supabase;
}

function filterProjects({
  projects,
  categoriesById,
  subcategoriesById,
  search,
  categorySlug,
  subcategorySlug,
  featuredFilter,
  coverFilter,
}: {
  projects: Project[];
  categoriesById: Map<string, Category>;
  subcategoriesById: Map<string, Subcategory>;
  search: string;
  categorySlug: string;
  subcategorySlug: string;
  featuredFilter: string;
  coverFilter: string;
}) {
  const normalizedSearch = search.trim().toLowerCase();

  return projects.filter((project) => {
    const category = project.category_id
      ? categoriesById.get(project.category_id)
      : null;
    const subcategory = project.subcategory_id
      ? subcategoriesById.get(project.subcategory_id)
      : null;

    const matchesCategory =
      !categorySlug || category?.slug === categorySlug;

    const matchesSubcategory =
      !subcategorySlug || subcategory?.slug === subcategorySlug;

    const matchesFeatured =
      featuredFilter === "todos" ||
      (featuredFilter === "destacados" && project.is_featured === true) ||
      (featuredFilter === "normales" && project.is_featured !== true);

    const hasCover = Boolean(project.cover_image?.trim());
    const matchesCover =
      coverFilter === "todas" ||
      (coverFilter === "con_portada" && hasCover) ||
      (coverFilter === "sin_portada" && !hasCover);

    const searchable = [
      project.title,
      project.slug,
      project.client,
      project.year,
      project.description,
      category?.name,
      subcategory?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch =
      !normalizedSearch || searchable.includes(normalizedSearch);

    return (
      matchesCategory &&
      matchesSubcategory &&
      matchesFeatured &&
      matchesCover &&
      matchesSearch
    );
  });
}

function sortProjects(
  projects: Project[],
  categoriesById: Map<string, Category>,
  subcategoriesById: Map<string, Subcategory>
) {
  return [...projects].sort((a, b) => {
    const categoryA = a.category_id
      ? categoriesById.get(a.category_id)
      : null;
    const categoryB = b.category_id
      ? categoriesById.get(b.category_id)
      : null;

    const categoryOrderA = Number(categoryA?.position ?? 9999);
    const categoryOrderB = Number(categoryB?.position ?? 9999);

    if (categoryOrderA !== categoryOrderB) {
      return categoryOrderA - categoryOrderB;
    }

    const subcategoryA = a.subcategory_id
      ? subcategoriesById.get(a.subcategory_id)
      : null;
    const subcategoryB = b.subcategory_id
      ? subcategoriesById.get(b.subcategory_id)
      : null;

    const subcategoryOrderA = Number(subcategoryA?.position ?? 9999);
    const subcategoryOrderB = Number(subcategoryB?.position ?? 9999);

    if (subcategoryOrderA !== subcategoryOrderB) {
      return subcategoryOrderA - subcategoryOrderB;
    }

    const projectOrderA = Number(a.display_order ?? 9999);
    const projectOrderB = Number(b.display_order ?? 9999);

    if (projectOrderA !== projectOrderB) {
      return projectOrderA - projectOrderB;
    }

    return a.title.localeCompare(b.title, "es");
  });
}

export default async function AdminPortafolioPage({ searchParams }: Props) {
  const params = await searchParams;

  const search = params.q ?? "";
  const selectedCategory = params.categoria ?? "";
  const requestedSubcategory = params.subcategoria ?? "";
  const selectedFeatured = params.destacado ?? "todos";
  const selectedCover = params.portada ?? "todas";

  const supabase = await getAdminSupabase();

  const [{ data: categories }, { data: subcategories }, { data: projects }] =
    await Promise.all([
      supabase
        .from("portfolio_categories")
        .select("id, name, slug, position, is_active")
        .order("position", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("portfolio_subcategories")
        .select("id, category_id, name, slug, position, is_active")
        .order("position", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true }),
      supabase
        .from("portfolio_projects")
        .select(`
          id,
          title,
          slug,
          description,
          category_id,
          subcategory_id,
          year,
          client,
          cover_image,
          image_fit,
          image_zoom,
          image_x,
          image_y,
          is_featured,
          featured_order,
          display_order,
          portfolio_images (
            id
          )
        `),
    ]);

  const categoryList = (categories ?? []) as Category[];
  const subcategoryList = (subcategories ?? []) as Subcategory[];
  const projectList = (projects ?? []) as Project[];

  const categoriesById = new Map(
    categoryList.map((category) => [category.id, category])
  );
  const subcategoriesById = new Map(
    subcategoryList.map((subcategory) => [subcategory.id, subcategory])
  );

  const selectedCategoryRecord = categoryList.find(
    (category) => category.slug === selectedCategory
  );

  const requestedSubcategoryRecord = subcategoryList.find(
    (subcategory) => subcategory.slug === requestedSubcategory
  );

  const selectedSubcategoryRecord =
    requestedSubcategoryRecord &&
    (!selectedCategoryRecord ||
      requestedSubcategoryRecord.category_id === selectedCategoryRecord.id)
      ? requestedSubcategoryRecord
      : null;

  const selectedSubcategory = selectedSubcategoryRecord?.slug ?? "";

  const availableSubcategories = selectedCategoryRecord
    ? subcategoryList.filter(
        (subcategory) =>
          subcategory.category_id === selectedCategoryRecord.id
      )
    : subcategoryList;

  const filteredProjects = sortProjects(
    filterProjects({
      projects: projectList,
      categoriesById,
      subcategoriesById,
      search,
      categorySlug: selectedCategory,
      subcategorySlug: selectedSubcategory,
      featuredFilter: selectedFeatured,
      coverFilter: selectedCover,
    }),
    categoriesById,
    subcategoriesById
  );

  const totalProjects = projectList.length;
  const featuredProjects = projectList.filter(
    (project) => project.is_featured === true
  ).length;
  const withCoverProjects = projectList.filter(
    (project) => Boolean(project.cover_image?.trim())
  ).length;
  const withoutCoverProjects = totalProjects - withCoverProjects;
  const totalImages = projectList.reduce(
    (sum, project) => sum + (project.portfolio_images?.length ?? 0),
    0
  );
  const activeCategories = categoryList.filter(
    (category) => category.is_active !== false
  ).length;

  const hasFilters =
    Boolean(search) ||
    Boolean(selectedCategory) ||
    Boolean(selectedSubcategory) ||
    selectedFeatured !== "todos" ||
    selectedCover !== "todas";

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
          <Link
            href="/admin"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Volver al panel
          </Link>

          <div className="mt-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/35">
                Administración
              </p>

              <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-7xl">
                Portafolio
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
                Organiza proyectos, categorías y galerías desde una vista compacta respetando el orden visual del portafolio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/portafolio/categorias"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm text-white/70 transition hover:bg-white hover:text-black"
              >
                Categorías
              </Link>

              <Link
                href="/admin/portafolio/nuevo"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
              >
                + Nuevo proyecto
              </Link>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Proyectos" value={totalProjects} />
            <StatCard label="Destacados" value={featuredProjects} tone="yellow" />
            <StatCard label="Con portada" value={withCoverProjects} tone="green" />
            <StatCard label="Sin portada" value={withoutCoverProjects} tone="red" />
            <StatCard label="Fotografías" value={totalImages} />
            <StatCard label="Categorías" value={activeCategories} />
          </div>

          <div className="mt-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em]">
                  Proyectos existentes
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Mostrando {filteredProjects.length} de {totalProjects} proyectos.
                  El orden sigue categoría, subcategoría y orden general.
                </p>
              </div>

              {hasFilters && (
                <Link
                  href="/admin/portafolio"
                  className="inline-flex w-fit rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm text-red-300 transition hover:border-red-400/40"
                >
                  Limpiar filtros
                </Link>
              )}
            </div>

            <form className="premium-card mt-6 rounded-[1.5rem] p-4 sm:p-5">
              <div className="grid gap-4 xl:grid-cols-[1.25fr_185px_210px_165px_165px_auto] xl:items-end">
                <AdminField label="Buscar proyecto">
                  <input
                    name="q"
                    defaultValue={search}
                    placeholder="Título, cliente, año..."
                    className={inputClass}
                  />
                </AdminField>

                <AdminField label="Categoría">
                  <select
                    name="categoria"
                    defaultValue={selectedCategory}
                    className={inputClass}
                  >
                    <option value="">Todas</option>
                    {categoryList.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {String(Number(category.position ?? 0)).padStart(2, "0")} · {category.name}
                      </option>
                    ))}
                  </select>
                </AdminField>

                <AdminField label="Subcategoría">
                  <select
                    name="subcategoria"
                    defaultValue={selectedSubcategory}
                    className={inputClass}
                  >
                    <option value="">Todas</option>
                    {availableSubcategories.map((subcategory) => {
                      const parent = categoriesById.get(subcategory.category_id);
                      const label = selectedCategoryRecord
                        ? `${String(Number(subcategory.position ?? 0)).padStart(2, "0")} · ${subcategory.name}`
                        : `${parent?.name ?? "Categoría"} · ${subcategory.name}`;

                      return (
                        <option key={subcategory.id} value={subcategory.slug}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </AdminField>

                <AdminField label="Destacado">
                  <select
                    name="destacado"
                    defaultValue={selectedFeatured}
                    className={inputClass}
                  >
                    <option value="todos">Todos</option>
                    <option value="destacados">Destacados</option>
                    <option value="normales">No destacados</option>
                  </select>
                </AdminField>

                <AdminField label="Portada">
                  <select
                    name="portada"
                    defaultValue={selectedCover}
                    className={inputClass}
                  >
                    <option value="todas">Todas</option>
                    <option value="con_portada">Con portada</option>
                    <option value="sin_portada">Sin portada</option>
                  </select>
                </AdminField>

                <button
                  type="submit"
                  className="min-h-12 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                >
                  Filtrar
                </button>
              </div>
            </form>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-neutral-950">
              <div className="hidden grid-cols-[minmax(290px,1.4fr)_minmax(185px,0.8fr)_minmax(150px,0.7fr)_90px_105px_120px_80px] gap-4 border-b border-white/10 px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-white/30 xl:grid">
                <span>Proyecto</span>
                <span>Clasificación</span>
                <span>Cliente / año</span>
                <span>Galería</span>
                <span>Orden</span>
                <span>Destacado</span>
                <span className="text-right">Acción</span>
              </div>

              {filteredProjects.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {filteredProjects.map((project) => {
                    const category = project.category_id
                      ? categoriesById.get(project.category_id)
                      : null;
                    const subcategory = project.subcategory_id
                      ? subcategoriesById.get(project.subcategory_id)
                      : null;
                    const imageCount = project.portfolio_images?.length ?? 0;

                    return (
                      <div
                        key={project.id}
                        className="group grid gap-4 px-4 py-4 transition hover:bg-white/[0.025] sm:px-5 xl:grid-cols-[minmax(290px,1.4fr)_minmax(185px,0.8fr)_minmax(150px,0.7fr)_90px_105px_120px_80px] xl:items-center"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          {project.cover_image ? (
                            <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-black">
                              <img
                                src={project.cover_image}
                                alt={project.title}
                                className="h-full w-full"
                                style={getImageStyle(project)}
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black text-[10px] text-white/30">
                              Sin portada
                            </div>
                          )}

                          <div className="min-w-0">
                            <h3 className="truncate font-semibold tracking-[-0.02em]">
                              {project.title}
                            </h3>
                            <p className="mt-1 truncate text-xs text-white/35">
                              /{project.slug}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-white/70">
                            {category
                              ? `${String(Number(category.position ?? 0)).padStart(2, "0")} · ${category.name}`
                              : "Sin categoría"}
                          </p>
                          <p className="mt-1 text-xs text-white/35">
                            {subcategory
                              ? `${String(Number(subcategory.position ?? 0)).padStart(2, "0")} · ${subcategory.name}`
                              : "Sin subcategoría"}
                          </p>
                        </div>

                        <div>
                          <p className="truncate text-sm text-white/70">
                            {project.client || "Sin cliente"}
                          </p>
                          <p className="mt-1 text-xs text-white/35">
                            {project.year || "Sin año"}
                          </p>
                        </div>

                        <div>
                          <p className="font-semibold">{imageCount}</p>
                          <p className="mt-1 text-xs text-white/35">
                            {imageCount === 1 ? "foto" : "fotos"}
                          </p>
                        </div>

                        <div>
                          <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/60">
                            #{Number(project.display_order ?? 0)}
                          </span>
                        </div>

                        <div>
                          {project.is_featured ? (
                            <span className="inline-flex rounded-full border border-yellow-400/25 bg-yellow-400/10 px-3 py-1.5 text-xs text-yellow-300">
                              Destacado #{Number(project.featured_order ?? 0)}
                            </span>
                          ) : (
                            <span className="text-xs text-white/30">Normal</span>
                          )}
                        </div>

                        <div className="xl:text-right">
                          <Link
                            href={`/admin/portafolio/${project.id}/editar`}
                            className="inline-flex items-center text-sm text-white/55 transition hover:text-white"
                          >
                            Editar →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 text-center text-white/45">
                  No hay proyectos que coincidan con estos filtros.
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function StatCard({
  label,
  value,
  tone = "white",
}: {
  label: string;
  value: number;
  tone?: "white" | "yellow" | "green" | "red";
}) {
  const toneClass =
    tone === "yellow"
      ? "text-yellow-400"
      : tone === "green"
      ? "text-green-400"
      : tone === "red"
      ? "text-red-300"
      : "text-white";

  return (
    <div className="premium-card rounded-[1.25rem] p-4 sm:rounded-[1.5rem] sm:p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        {label}
      </p>
      <p className={`mt-3 text-2xl font-bold sm:text-3xl ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function AdminField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/35">
        {label}
      </span>
      {children}
    </label>
  );
}
