import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import {
  adminNewOrderEmail,
  customerOrderConfirmationEmail,
} from "@/lib/email/templates";

const resend = new Resend(process.env.RESEND_API_KEY);

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
};

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json();

  const {
    customer_name,
    customer_email,
    customer_phone,
    department,
    city,
    address,
    reference,
    notes,
    total,
    items,
  }: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    department: string;
    city: string;
    address: string;
    reference: string;
    notes: string;
    total: number;
    items: CartItem[];
  } = body;

  if (!items || items.length === 0) {
    return NextResponse.json(
      { error: "El carrito está vacío." },
      { status: 400 }
    );
  }

  const now = new Date();
  const year = now.getFullYear();

  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`)
    .lte("created_at", `${year}-12-31`);

  const orderNumber = (count ?? 0) + 1;
  const orderCode = `ORD-${year}-${String(orderNumber).padStart(4, "0")}`;

  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.id)
      .single();

    if ((product?.stock ?? 0) < item.quantity) {
      return NextResponse.json(
        { error: `Stock insuficiente para ${item.name}` },
        { status: 400 }
      );
    }
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      order_code: orderCode,
      customer_name,
      customer_email,
      customer_phone,
      department,
      city,
      address,
      reference,
      notes,
      total,
      status: "pendiente",
    })
    .select("id, order_code")
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: orderError?.message ?? "No se pudo crear el pedido." },
      { status: 500 }
    );
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image_url,
    }))
  );

  if (itemsError) {
    return NextResponse.json(
      { error: itemsError.message },
      { status: 500 }
    );
  }

  for (const item of items) {
    const { data: product } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.id)
      .single();

    const newStock = Math.max((product?.stock ?? 0) - item.quantity, 0);

    const { error: stockError } = await supabase
      .from("products")
      .update({ stock: newStock })
      .eq("id", item.id);

    if (stockError) {
      return NextResponse.json(
        {
          error: `Pedido creado, pero no se pudo actualizar stock: ${stockError.message}`,
        },
        { status: 500 }
      );
    }
  }

  const productsHtml = items
    .map(
      (item) =>
        `<li>${item.name} x${item.quantity} - $${item.price.toLocaleString(
          "es-CO"
        )}</li>`
    )
    .join("");

try {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: customer_email,
    subject: `Confirmación de pedido ${orderCode}`,
    html: customerOrderConfirmationEmail({
      orderCode,
      customerName: customer_name,
      total,
      products: items,
      address,
      city,
      department,
    }),
  });
} catch {
  console.warn("No se pudo enviar el correo al cliente.");
}

try {
  await resend.emails.send({
    from: "onboarding@resend.dev",
    to: process.env.ADMIN_ORDER_EMAIL!,
    subject: `Nuevo pedido ${orderCode}`,
    html: adminNewOrderEmail({
      orderCode,
      customerName: customer_name,
      customerEmail: customer_email,
      customerPhone: customer_phone,
      linkedUser: user?.email ?? "Compra sin cuenta",
      total,
      products: items,
      address,
      city,
      department,
    }),
  });
} catch {
  console.warn("No se pudo enviar el correo al negocio.");
}

  return NextResponse.json({
    success: true,
    orderId: order.id,
    orderCode: order.order_code,
  });
}