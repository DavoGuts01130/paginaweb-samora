import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import PortfolioCategoryManager from "@/components/PortfolioCategoryManager";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPortfolioCategoriesPage() {
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
    .select("id, name, slug, description, position, is_active")
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  const { data: subcategories } = await supabase
    .from("portfolio_subcategories")
    .select("id, category_id, name, slug, description, position, is_active")
    .order("position", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-6 py-12">
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

            <h1 className="mt-4 text-4xl font-bold md:text-6xl">
              Categorías
            </h1>

            <p className="mt-4 max-w-2xl text-white/55">
              Organiza el portafolio por categorías principales y
              subcategorías para que la navegación sea más clara.
            </p>
          </div>

          <div className="mt-12">
            <PortfolioCategoryManager
              categories={categories ?? []}
              subcategories={subcategories ?? []}
            />
          </div>
        </section>
      </main>
    </>
  );
}