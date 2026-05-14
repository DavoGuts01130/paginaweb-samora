import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { statusUpdateEmail } from "@/lib/email/templates";

const resend = new Resend(process.env.RESEND_API_KEY);

function getStatusMessage(status: string) {
  if (status === "pendiente") {
    return "Tu pedido fue recibido correctamente.";
  }

  if (status === "en proceso") {
    return "Tu pedido ya está en preparación.";
  }

  if (status === "entregado") {
    return "Tu pedido ha sido marcado como entregado.";
  }

  if (status === "cancelado") {
    return "Tu pedido ha sido cancelado. Si tienes dudas, puedes contactarnos.";
  }

  return "El estado de tu pedido fue actualizado.";
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const { orderId, status } = await request.json();

  if (!orderId || !status) {
    return NextResponse.json(
      { error: "Faltan datos para enviar la notificación." },
      { status: 400 }
    );
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_code,
      customer_name,
      customer_email,
      total,
      status,
      order_items (
        name,
        price,
        quantity
      )
    `)
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return NextResponse.json(
      { error: "Pedido no encontrado." },
      { status: 404 }
    );
  }

  const productsHtml =
    order.order_items
      ?.map(
        (item) =>
          `<li>${item.name} x${item.quantity} - $${Number(
            item.price
          ).toLocaleString("es-CO")}</li>`
      )
      .join("") ?? "";

 await resend.emails.send({
   from: "onboarding@resend.dev",
   to: order.customer_email,
   subject: `Actualización de tu pedido ${order.order_code}`,
   html: statusUpdateEmail({
     orderCode: order.order_code,
     customerName: order.customer_name,
     total: Number(order.total ?? 0),
     status,
     message: getStatusMessage(status),
     products:
      order.order_items?.map((item) => ({
        name: item.name,
        price: Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 0),
      })) ?? [],
  }),
 });

  return NextResponse.json({ success: true });
}