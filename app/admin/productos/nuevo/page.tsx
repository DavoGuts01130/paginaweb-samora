import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import CreateProductForm from "@/components/CreateProductForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
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

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:py-14">
          <Link
            href="/admin/productos"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Volver a productos
          </Link>

          <div className="mt-8">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Administración
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-6xl">
              Crear producto
            </h1>
            <p className="mt-4 max-w-2xl text-white/55">
              Crea el producto primero. Después podrás abrir su edición dedicada para asignar categoría, margen y variantes.
            </p>
          </div>

          <div className="mt-10">
            <CreateProductForm />
          </div>
        </section>
      </main>
    </>
  );
}
