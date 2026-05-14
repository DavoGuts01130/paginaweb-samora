import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import EditProductForm from "@/components/EditProductForm";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditProductPage({ params }: Props) {
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

  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) redirect("/admin/productos");

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-4xl px-6 py-12">
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

            <h1 className="mt-4 text-4xl font-bold md:text-6xl">
              Editar producto
            </h1>

            <p className="mt-4 max-w-2xl text-white/55">
              Actualiza la información, precio, stock y visibilidad del producto.
            </p>
          </div>

          <div className="mt-10">
            <EditProductForm product={product} />
          </div>
        </section>
      </main>
    </>
  );
}