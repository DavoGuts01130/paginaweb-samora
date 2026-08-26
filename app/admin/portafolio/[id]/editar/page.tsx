import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import EditProjectForm from "@/components/EditProjectForm";
import UploadProjectImages from "@/components/UploadProjectImages";
import ProjectImagesManager from "@/components/ProjectImagesManager";
import DeleteProjectButton from "@/components/DeleteProjectButton";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
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

  const [
    { data: project },
    { data: categories },
    { data: subcategories },
    { data: images },
  ] = await Promise.all([
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
        display_order
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("portfolio_categories")
      .select("id, name, slug, is_active")
      .order("position", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("portfolio_subcategories")
      .select("id, category_id, name, slug, is_active")
      .order("position", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("portfolio_images")
      .select(`
        id,
        image_url,
        position,
        image_fit,
        image_zoom,
        image_x,
        image_y
      `)
      .eq("project_id", id)
      .order("position", { ascending: true, nullsFirst: false }),
  ]);

  if (!project) notFound();

  const activeCategories = (categories ?? []).filter(
    (category) => category.is_active !== false || category.id === project.category_id
  );

  const activeSubcategories = (subcategories ?? []).filter(
    (subcategory) =>
      subcategory.is_active !== false ||
      subcategory.id === project.subcategory_id
  );

  const category = (categories ?? []).find(
    (item) => item.id === project.category_id
  );

  const publicHref =
    category?.slug && project.slug
      ? `/portafolio/${category.slug}/${project.slug}`
      : null;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/admin/portafolio"
              className="text-sm text-white/50 transition hover:text-white"
            >
              ← Volver al portafolio
            </Link>

            {publicHref && (
              <Link
                href={publicHref}
                className="text-sm text-white/50 transition hover:text-white"
              >
                Ver proyecto →
              </Link>
            )}
          </div>

          <div className="mt-8">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Administración
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-6xl">
              Editar proyecto
            </h1>

            <p className="mt-3 text-lg text-white/60">{project.title}</p>
          </div>

          <div className="mt-10 grid gap-6">
            <section>
              <SectionHeader
                eyebrow="Información del proyecto"
                title="Contenido, clasificación y portada"
                description="Edita los datos principales, el orden del proyecto y cómo se presenta su portada."
              />

              <div className="mt-5">
                <EditProjectForm
                  project={project}
                  categories={activeCategories}
                  subcategories={activeSubcategories}
                />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <SectionHeader
                  eyebrow="Galería"
                  title="Fotografías del proyecto"
                  description="Sube nuevas imágenes, cambia su orden y ajusta individualmente el encuadre de cada fotografía."
                />

                <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/45">
                  {(images ?? []).length} {(images ?? []).length === 1 ? "fotografía" : "fotografías"}
                </span>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-sm font-medium">Agregar fotografías</p>
                <p className="mt-1 text-xs leading-5 text-white/35">
                  Puedes seleccionar varias imágenes a la vez. Se optimizan automáticamente antes de subirlas.
                </p>

                <UploadProjectImages projectId={project.id} />
              </div>

              <div className="mt-5">
                <ProjectImagesManager images={images ?? []} />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-red-400/15 bg-red-400/[0.035] p-5 sm:p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-red-300/60">
                Zona de peligro
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Eliminar proyecto
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
                Eliminar un proyecto también elimina su relación con la galería. Usa esta opción únicamente cuando estés seguro de retirarlo definitivamente.
              </p>

              <div className="mt-4">
                <DeleteProjectButton projectId={project.id} />
              </div>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-white/30">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
        {description}
      </p>
    </div>
  );
}
