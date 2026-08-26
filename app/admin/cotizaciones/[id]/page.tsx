import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import QuoteRequestsAdmin, {
  type QuoteRequest,
} from "@/components/QuoteRequestsAdmin";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Detalle de cotización | Admin Samora",
  description: "Gestión dedicada del proceso comercial de una cotización de servicios.",
};

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const { data: quote, error } = await supabase
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
      reservation_status,
      deposit_required_cop,
      deposit_paid_cop,
      payment_method,
      payment_provider,
      payment_reference,
      payment_status,
      paid_at,
      reservation_confirmed_at,
      reservation_notes,
      source,
      created_at,
      updated_at
    `
    )
    .eq("id", id)
    .single();

  if (error || !quote) notFound();

  const typedQuote = quote as QuoteRequest;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/admin/cotizaciones"
              className="text-sm text-white/50 transition hover:text-white"
            >
              ← Volver a cotizaciones
            </Link>

            <span className="text-xs uppercase tracking-[0.25em] text-white/30">
              Solicitud de servicio
            </span>
          </div>

          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.35em] text-white/35">
              Cotización
            </p>

            <h1 className="mt-4 break-words text-3xl font-semibold tracking-[-0.04em] sm:text-4xl md:text-5xl">
              {typedQuote.quote_code}
            </h1>

            <p className="mt-3 text-lg text-white/60">
              {typedQuote.customer_name || "Cliente sin nombre"} ·{" "}
              {typedQuote.service_label}
            </p>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/40">
              Esta vista concentra el proceso completo del cliente: información,
              reunión, propuesta, agenda, aprobación, abono, reserva, comunicaciones
              y seguimiento CRM.
            </p>
          </div>

          <div className="mt-10">
            <QuoteRequestsAdmin
              initialQuotes={[typedQuote]}
              detailOnly
            />
          </div>
        </section>
      </main>
    </>
  );
}
