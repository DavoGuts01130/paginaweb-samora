import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import QuoteRequestsAdmin, {
  type QuoteRequest,
} from "@/components/QuoteRequestsAdmin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Cotizaciones | Admin Samora",
  description: "Panel administrativo para revisar solicitudes de cotización.",
};

export const dynamic = "force-dynamic";

export default async function AdminCotizacionesPage() {
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

  const { data: quoteRequests, error } = await supabase
    .from("quote_requests")
    .select(
      `
      id,
      quote_code,
      customer_name,
      customer_phone,
      customer_email,
      customer_document,
      service_type,
      service_label,
      event_date,
      service_zone,
      service_zone_label,
      service_location,
      duration_value,
      duration_unit,
      duration_hours,
      quantity,
      guest_count,
      digital_delivery,
      printed_delivery,
      special_deliverable,
      details,
      base_min_cop,
      base_max_cop,
      travel_surcharge_percent,
      travel_surcharge_min_cop,
      travel_surcharge_max_cop,
      estimated_min_cop,
      estimated_max_cop,
      requires_travel_review,
      requires_manual_review,
      whatsapp_message,
      status,
      admin_notes,
      approved_at,
      scheduled_at,
      google_calendar_event_id,
      confirmed_event_date,
      confirmed_start_time,
      confirmed_end_time,
      confirmed_timezone,
      confirmed_location,
      schedule_notes,
      meeting_requested,
      meeting_type,
      meeting_status,
      meeting_date,
      meeting_start_time,
      meeting_end_time,
      meeting_location,
      meeting_notes,
      meeting_completed_at,
      internal_pricing_notes,
      selected_package,
      final_price_cop,
      final_quote_sent_at,
      final_pdf_url,
      source,
      created_at,
      updated_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(150);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
          <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                Admin
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl md:text-6xl">
                Cotizaciones
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50 sm:text-base">
                Revisa solicitudes, coordina reuniones, ajusta valores finales,
                prepara PDFs y deja lista la agenda cuando el cliente apruebe.
              </p>
            </div>

            <Link
              href="/admin"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-6 py-3 text-sm text-white/70 transition hover:border-white/35 hover:bg-white hover:text-black"
            >
              Volver al panel
            </Link>
          </div>

          {error ? (
            <div className="rounded-[2rem] border border-red-400/20 bg-red-400/10 p-6 text-sm leading-6 text-red-100/80">
              No se pudieron cargar las cotizaciones. Revisa que la tabla{" "}
              <span className="font-semibold">quote_requests</span> tenga las
              columnas nuevas para reunión, correo, documento, invitados y valor
              final.
              <br />
              <span className="mt-2 block text-red-100/60">
                Error: {error.message}
              </span>
            </div>
          ) : (
            <QuoteRequestsAdmin
              initialQuotes={(quoteRequests ?? []) as QuoteRequest[]}
            />
          )}
        </section>
      </main>
    </>
  );
}
