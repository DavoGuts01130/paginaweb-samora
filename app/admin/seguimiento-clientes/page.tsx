import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import CustomerFollowupsAdmin from "@/components/CustomerFollowupsAdmin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Seguimiento de clientes",
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
    <main className="min-h-screen bg-black px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/35">
              Panel admin
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              Seguimiento de clientes
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/50 sm:text-base sm:leading-7">
              Organiza clientes pendientes, contactos manuales, recordatorios,
              estados comerciales y mensajes rápidos por WhatsApp.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
            >
              Volver al panel
            </Link>
          </div>
        </div>

        <CustomerFollowupsAdmin initialFollowups={followups ?? []} />
      </div>
    </main>
  );
}