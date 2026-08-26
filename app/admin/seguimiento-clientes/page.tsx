import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import CustomerFollowupsAdmin from "@/components/CustomerFollowupsAdmin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Seguimiento de clientes | Admin Samora",
  description:
    "CRM comercial para organizar clientes, cotizaciones, pedidos y próximos contactos.",
};

export type CustomerFollowup = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_document: string | null;
  related_type: string;
  related_id: string | null;
  related_code: string | null;
  source: string;
  status: string;
  priority: string;
  title: string | null;
  summary: string | null;
  internal_notes: string | null;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  contact_attempts: number;
  last_channel: string | null;
  last_message_type: string | null;
  last_message_body: string | null;
  created_at: string;
  updated_at: string;
};

export default async function AdminCustomerFollowupsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const { data: followups, error } = await supabase
    .from("customer_followups")
    .select(
      `
      id,
      customer_name,
      customer_phone,
      customer_email,
      customer_document,
      related_type,
      related_id,
      related_code,
      source,
      status,
      priority,
      title,
      summary,
      internal_notes,
      last_contacted_at,
      next_followup_at,
      contact_attempts,
      last_channel,
      last_message_type,
      last_message_body,
      created_at,
      updated_at
    `
    )
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error cargando seguimientos:", error.message);
  }

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

          <div className="mt-8">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Administración
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl md:text-7xl">
              Seguimiento de clientes
            </h1>

            <p className="mt-4 max-w-3xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
              Centraliza clientes pendientes, próximos contactos y procesos
              comerciales provenientes de cotizaciones y pedidos sin perder el
              contexto de cada origen.
            </p>
          </div>

          <div className="mt-10">
            <CustomerFollowupsAdmin initialFollowups={followups ?? []} />
          </div>
        </section>
      </main>
    </>
  );
}
