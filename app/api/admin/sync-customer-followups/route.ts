import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type QuoteRequest = {
  id: string;
  status: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_document: string | null;
  service_type: string | null;
  event_date: string | null;
  created_at: string;
};

type Order = {
  id: string;
  order_code: string | null;
  customer_name: string | null;
  created_at: string;
  total: number | null;
  status: string | null;
};

type FollowupPayload = {
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  customer_document: string | null;
  related_type: "quote_request" | "store_order";
  related_id: string;
  related_code: string;
  source: "quote_request" | "store_order";
  status:
    | "pendiente_contactar"
    | "contactado"
    | "sin_respuesta"
    | "esperando_cliente"
    | "esperando_pago"
    | "esperando_comprobante"
    | "entrega_pendiente"
    | "seguimiento_programado"
    | "revisar_manual"
    | "cerrado"
    | "cancelado";
  priority: "baja" | "normal" | "alta" | "urgente";
  title: string;
  summary: string | null;
};

function getQuoteStatus(status: string | null): FollowupPayload["status"] {
  if (!status || status === "new" || status === "new_travel_review") {
    return "pendiente_contactar";
  }

  if (status === "reviewing" || status === "en_revision") {
    return "revisar_manual";
  }

  if (
    status === "approved" ||
    status === "aprobada" ||
    status === "reservada"
  ) {
    return "seguimiento_programado";
  }

  if (status === "finalizada") {
    return "cerrado";
  }

  if (status === "cancelada") {
    return "cancelado";
  }

  return "pendiente_contactar";
}

function getOrderStatus(order: Order): FollowupPayload["status"] {
  if (order.status === "cancelado") return "cancelado";
  if (order.status === "entregado") return "cerrado";
  if (order.status === "en proceso") return "entrega_pendiente";
  if (order.status === "pendiente") return "pendiente_contactar";

  return "pendiente_contactar";
}

function getPriorityFromQuote(quote: QuoteRequest): FollowupPayload["priority"] {
  if (quote.status === "new_travel_review") return "alta";
  if (quote.status === "reviewing" || quote.status === "en_revision") {
    return "alta";
  }

  return "normal";
}

function getPriorityFromOrder(order: Order): FollowupPayload["priority"] {
  if (order.status === "pendiente") return "normal";
  if (order.status === "en proceso") return "normal";

  return "normal";
}

function getRelatedCode(id: string, code?: string | null) {
  return code?.trim() || id.slice(0, 8).toUpperCase();
}

function normalizeText(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function makeKey(relatedType: string, relatedId: string | null) {
  return `${relatedType}:${relatedId}`;
}

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }

    const [
      { data: quotes, error: quotesError },
      { data: orders, error: ordersError },
    ] = await Promise.all([
      supabase
        .from("quote_requests")
        .select(
          `
          id,
          status,
          customer_name,
          customer_phone,
          customer_email,
          customer_document,
          service_type,
          event_date,
          created_at
        `
        )
        .order("created_at", { ascending: false })
        .limit(300),

      supabase
        .from("orders")
        .select(
          `
          id,
          order_code,
          customer_name,
          created_at,
          total,
          status
        `
        )
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

    if (quotesError) {
      console.error("Error leyendo cotizaciones:", quotesError.message);

      return NextResponse.json(
        {
          error: "No se pudieron leer las cotizaciones.",
          detail: quotesError.message,
        },
        { status: 500 }
      );
    }

    if (ordersError) {
      console.error("Error leyendo pedidos:", ordersError.message);

      return NextResponse.json(
        {
          error: "No se pudieron leer los pedidos.",
          detail: ordersError.message,
        },
        { status: 500 }
      );
    }

    const quotePayload: FollowupPayload[] = ((quotes ?? []) as QuoteRequest[])
      .filter((quote) => quote.status !== "finalizada")
      .filter((quote) => quote.status !== "cancelada")
      .map((quote) => ({
        customer_name: normalizeText(quote.customer_name),
        customer_phone: normalizeText(quote.customer_phone),
        customer_email: normalizeText(quote.customer_email),
        customer_document: normalizeText(quote.customer_document),
        related_type: "quote_request",
        related_id: quote.id,
        related_code: getRelatedCode(quote.id),
        source: "quote_request",
        status: getQuoteStatus(quote.status),
        priority: getPriorityFromQuote(quote),
        title: "Seguimiento de cotización",
        summary:
          [
            quote.service_type ? `Servicio: ${quote.service_type}` : null,
            quote.event_date ? `Fecha evento: ${quote.event_date}` : null,
            quote.status ? `Estado: ${quote.status}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || null,
      }));

    const orderPayload: FollowupPayload[] = ((orders ?? []) as Order[])
      .filter((order) => order.status !== "entregado")
      .filter((order) => order.status !== "cancelado")
      .map((order) => ({
        customer_name: normalizeText(order.customer_name),
        customer_phone: null,
        customer_email: null,
        customer_document: null,
        related_type: "store_order",
        related_id: order.id,
        related_code: getRelatedCode(order.id, order.order_code),
        source: "store_order",
        status: getOrderStatus(order),
        priority: getPriorityFromOrder(order),
        title: "Seguimiento de pedido",
        summary:
          [
            order.order_code ? `Pedido: ${order.order_code}` : null,
            order.status ? `Estado: ${order.status}` : null,
            order.total ? `Total: ${order.total}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || null,
      }));

    const payload = [...quotePayload, ...orderPayload];

    if (payload.length === 0) {
      return NextResponse.json({
        inserted: 0,
        processed: 0,
        skipped: 0,
        message: "No hay cotizaciones o pedidos pendientes para sincronizar.",
      });
    }

    const relatedIds = payload.map((item) => item.related_id);

    const { data: existingFollowups, error: existingError } = await supabase
      .from("customer_followups")
      .select("related_type, related_id")
      .in("related_id", relatedIds);

    if (existingError) {
      console.error(
        "Error revisando seguimientos existentes:",
        existingError.message
      );

      return NextResponse.json(
        {
          error: "No se pudieron revisar los seguimientos existentes.",
          detail: existingError.message,
        },
        { status: 500 }
      );
    }

    const existingKeys = new Set(
      (existingFollowups ?? [])
        .filter((item) => item.related_id)
        .map((item) => makeKey(item.related_type, item.related_id))
    );

    const newPayload = payload.filter(
      (item) => !existingKeys.has(makeKey(item.related_type, item.related_id))
    );

    if (newPayload.length === 0) {
      return NextResponse.json({
        inserted: 0,
        processed: payload.length,
        skipped: payload.length,
        message: "Los seguimientos ya estaban sincronizados.",
      });
    }

    const { data, error } = await supabase
      .from("customer_followups")
      .insert(newPayload)
      .select("id");

    if (error) {
      console.error("Error insertando seguimientos:", error.message);

      return NextResponse.json(
        {
          error: "No se pudieron sincronizar los seguimientos.",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      inserted: data?.length ?? 0,
      processed: payload.length,
      skipped: payload.length - newPayload.length,
    });
  } catch (error) {
    console.error("Error en sync-customer-followups:", error);

    return NextResponse.json(
      {
        error: "Error inesperado sincronizando seguimientos.",
        detail: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}