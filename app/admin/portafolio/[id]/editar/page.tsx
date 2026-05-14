import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import EditProjectForm from "@/components/EditProjectForm";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
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

  const { data: categories } = await supabase
    .from("portfolio_categories")
    .select("id, name, slug")
    .order("created_at", { ascending: true });

  const { data: project, error } = await supabase
    .from("portfolio_projects")
    .select(
      `
      id,
      title,
      slug,
      description,
      category_id,
      year,
      client,
      cover_image
    `
    )
    .eq("id", id)
    .single();

  if (error || !project) redirect("/admin/portafolio");

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-4xl px-6 py-12">
          <Link
            href="/admin/portafolio"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Volver al portafolio
          </Link>

          <div className="mt-8">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Editar proyecto
            </p>

            <h1 className="mt-4 text-4xl font-bold md:text-6xl">
              {project.title}
            </h1>
          </div>

          <div className="mt-10">
            <EditProjectForm
              project={project}
              categories={categories ?? []}
            />
          </div>
        </section>
      </main>
    </>
  );
}