import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import CreateProjectForm from "@/components/CreateProjectForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewPortfolioProjectPage() {
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

  const [{ data: categories }, { data: subcategories }] = await Promise.all([
    supabase
      .from("portfolio_categories")
      .select("id, name, slug, is_active")
      .eq("is_active", true)
      .order("position", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
    supabase
      .from("portfolio_subcategories")
      .select("id, category_id, name, slug, is_active")
      .eq("is_active", true)
      .order("position", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
  ]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14">
          <Link
            href="/admin/portafolio"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Volver al portafolio
          </Link>

          <div className="mt-8">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Administración
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-6xl">
              Nuevo proyecto
            </h1>

            <p className="mt-4 max-w-2xl text-white/55">
              Crea la información principal y la portada. Al terminar pasarás a la edición dedicada para cargar y ordenar la galería.
            </p>
          </div>

          <div className="mt-10">
            <CreateProjectForm
              categories={categories ?? []}
              subcategories={subcategories ?? []}
            />
          </div>
        </section>
      </main>
    </>
  );
}
