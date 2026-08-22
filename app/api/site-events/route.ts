import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedEventTypes = new Set([
  "page_view",
  "quote_click",
  "whatsapp_click",
  "cart_click",
  "checkout_start",
  "order_created",
  "tracking_search",
  "portfolio_view",
  "product_view",
  "service_view",
  "reservation_view",
  "admin_view",
  "other",
]);

const allowedDeviceTypes = new Set(["mobile", "tablet", "desktop", "unknown"]);

function cleanText(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned) return null;
  return cleaned.slice(0, maxLength);
}

function cleanNumber(value: unknown) {
  const number = Number(value);
  if (!Number.isFinite(number)) return null;
  return Math.max(0, Math.min(number, 10000));
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  try {
    const serialized = JSON.stringify(value);

    if (serialized.length > 5000) {
      return {};
    }

    return JSON.parse(serialized);
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const eventType = cleanText(body.event_type, 80) ?? "other";

    if (!allowedEventTypes.has(eventType)) {
      return NextResponse.json(
        { error: "Tipo de evento no permitido." },
        { status: 400 }
      );
    }

    const path = cleanText(body.path, 500) ?? "/";

    const deviceType = cleanText(body.device_type, 40);

    const payload = {
      event_type: eventType,
      path,
      page_title: cleanText(body.page_title, 250),
      referrer: cleanText(body.referrer, 700),
      session_id: cleanText(body.session_id, 120),
      visitor_id: cleanText(body.visitor_id, 120),
      device_type:
        deviceType && allowedDeviceTypes.has(deviceType)
          ? deviceType
          : "unknown",
      viewport_width: cleanNumber(body.viewport_width),
      viewport_height: cleanNumber(body.viewport_height),
      utm_source: cleanText(body.utm_source, 120),
      utm_medium: cleanText(body.utm_medium, 120),
      utm_campaign: cleanText(body.utm_campaign, 160),
      utm_content: cleanText(body.utm_content, 160),
      utm_term: cleanText(body.utm_term, 160),
      related_type: cleanText(body.related_type, 80),
      related_id: cleanText(body.related_id, 120),
      related_code: cleanText(body.related_code, 160),
      metadata: cleanMetadata(body.metadata),
    };

    const supabase = await createClient();

    const { error } = await supabase.from("site_events").insert(payload);

    if (error) {
      console.error("Error registrando site_event:", error.message);

      return NextResponse.json(
        { error: "No se pudo registrar el evento." },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error en /api/site-events:", error);

    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 }
    );
  }
}