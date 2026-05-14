import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import CreateProjectForm from "@/components/CreateProjectForm";
import UploadProjectImages from "@/components/UploadProjectImages";
import ProjectImagesManager from "@/components/ProjectImagesManager";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPortafolioPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/");
  }

  const { data: categories } = await supabase
    .from("portfolio_categories")
    .select("id, name, slug")
    .order("created_at", { ascending: true });

  const { data: projects } = await supabase
    .from("portfolio_projects")
    .select(`
      id,
      title,
      slug,
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
      portfolio_categories (
        name,
        slug
      ),
      portfolio_images (
        id,
        image_url,
        position,
        image_fit,
        image_zoom,
        image_x,
        image_y
      )
    `)
    .order("display_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-6 py-12">
          <Link
            href="/admin"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Volver al panel
          </Link>

          <div className="mt-8">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Administración
            </p>

            <h1 className="mt-4 text-4xl font-bold md:text-6xl">
              Portafolio
            </h1>

            <p className="mt-4 max-w-2xl text-white/55">
              Crea y gestiona proyectos del portafolio sin tocar código.
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <CreateProjectForm categories={categories ?? []} />

            <div>
              <h2 className="text-2xl font-semibold">Proyectos existentes</h2>

              <div className="mt-6 space-y-4">
                {projects && projects.length > 0 ? (
                  projects.map((project) => {
                    const category = Array.isArray(project.portfolio_categories)
                      ? project.portfolio_categories[0]
                      : project.portfolio_categories;

                    const projectImages = Array.isArray(project.portfolio_images)
                      ? project.portfolio_images
                      : [];

                    const imageFit = project.image_fit ?? "cover";
                    const imageZoom = Number(project.image_zoom ?? 1);
                    const imageX = Number(project.image_x ?? 50);
                    const imageY = Number(project.image_y ?? 50);

                    return (
                      <div
                        key={project.id}
                        className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5 transition hover:border-white/20"
                      >
                        <div className="flex gap-5">
                          {project.cover_image && (
                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-black">
                              <img
                                src={project.cover_image}
                                alt={project.title}
                                className="h-full w-full"
                                style={{
                                  objectFit: imageFit,
                                  objectPosition: `${imageX}% ${imageY}%`,
                                  transform: `scale(${imageZoom})`,
                                }}
                              />
                            </div>
                          )}

                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xs uppercase tracking-[0.25em] text-white/35">
                                {category?.name ?? "Sin categoría"}
                              </p>

                              {project.is_featured && (
                                <span className="rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-medium text-yellow-400">
                                  Destacado #{project.featured_order ?? 0}
                                </span>
                              )}

                              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/35">
                                Orden {project.display_order ?? 0}
                              </span>
                            </div>

                            <h3 className="mt-2 text-xl font-semibold">
                              {project.title}
                            </h3>

                            <p className="mt-1 text-sm text-white/45">
                              {project.client || "Sin cliente"} ·{" "}
                              {project.year || "Sin año"}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-4">
                              {category?.slug && (
                                <Link
                                  href={`/portafolio/${category.slug}/${project.slug}`}
                                  className="text-sm text-white/70 transition hover:text-white"
                                >
                                  Ver proyecto →
                                </Link>
                              )}

                              <Link
                                href={`/admin/portafolio/${project.id}/editar`}
                                className="text-sm text-white/70 transition hover:text-white"
                              >
                                Editar →
                              </Link>

                              <DeleteProjectButton projectId={project.id} />
                            </div>

                            <UploadProjectImages projectId={project.id} />

                            <ProjectImagesManager images={projectImages} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-white/50">Aún no hay proyectos.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}