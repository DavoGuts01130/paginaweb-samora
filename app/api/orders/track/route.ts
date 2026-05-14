import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Código requerido" }, { status: 400 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select(`
      order_code,
      customer_name,
      total,
      status,
      created_at,
      address,
      city,
      department,
      reference,
      order_items (
        id,
        name,
        price,
        quantity,
        image_url
      )
    `)
    .eq("order_code", code.trim())
    .single();

  if (error || !order) {
    return NextResponse.json(
      { error: "Pedido no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json({ order });
}