import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import EditProfileForm from "@/components/EditProfileForm";

export default async function EditarMiCuentaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-3xl px-6 py-12">
          <Link
            href="/mi-cuenta"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Volver a mi cuenta
          </Link>

          <div className="mt-8">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Perfil
            </p>

            <h1 className="mt-4 text-4xl font-bold md:text-6xl">
              Editar datos
            </h1>

            <p className="mt-4 text-white/55">
              Actualiza tu información para facilitar futuras compras y entregas.
            </p>
          </div>

          <div className="mt-10">
            <EditProfileForm
              profile={{
                full_name: profile?.full_name ?? "",
                phone: profile?.phone ?? "",
                department: profile?.department ?? "",
                city: profile?.city ?? "",
                address: profile?.address ?? "",
                reference: profile?.reference ?? "",
              }}
            />
          </div>
        </section>
      </main>
    </>
  );
}