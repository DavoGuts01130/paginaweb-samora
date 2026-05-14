import PDFDocument from "pdfkit/js/pdfkit.standalone";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function formatCurrency(value: number) {
  return `$${Number(value ?? 0).toLocaleString("es-CO")}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getStatusLabel(status: string) {
  if (status === "pendiente") return "Pendiente";
  if (status === "en proceso") return "En proceso";
  if (status === "entregado") return "Entregado";
  if (status === "cancelado") return "Cancelado";
  return status;
}

function streamToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return Response.json(
        { error: "Código requerido" },
        { status: 400 }
      );
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select(`
        order_code,
        customer_name,
        customer_email,
        customer_phone,
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
          quantity
        )
      `)
      .eq("order_code", code.trim())
      .single();

    if (error || !order) {
      return Response.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const bufferPromise = streamToBuffer(doc);

    const pageWidth = doc.page.width;
    const left = 50;
    const right = pageWidth - 50;

    doc.rect(0, 0, pageWidth, 130).fill("#050505");

    doc
      .fillColor("#ffffff")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("SAMORA STUDIO", left, 45);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#b5b5b5")
      .text("Fotografía profesional · Comprobante de pedido", left, 75);

    doc
      .fontSize(10)
      .fillColor("#ffffff")
      .text(`Pedido: ${order.order_code}`, right - 180, 45, {
        width: 180,
        align: "right",
      });

    doc
      .fontSize(9)
      .fillColor("#b5b5b5")
      .text(`Fecha: ${formatDate(order.created_at)}`, right - 180, 65, {
        width: 180,
        align: "right",
      });

    doc
      .fontSize(9)
      .fillColor("#b5b5b5")
      .text(`Estado: ${getStatusLabel(order.status)}`, right - 180, 85, {
        width: 180,
        align: "right",
      });

    let y = 165;

    doc.roundedRect(left, y, pageWidth - 100, 115, 14).fill("#f6f6f6");

    doc
      .fillColor("#111111")
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Datos del cliente", left + 20, y + 18);

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text(`Nombre: ${order.customer_name}`, left + 20, y + 45)
      .text(`Correo: ${order.customer_email ?? "No registrado"}`, left + 20, y + 62)
      .text(`Teléfono: ${order.customer_phone ?? "No registrado"}`, left + 20, y + 79);

    doc
      .fontSize(10)
      .fillColor("#333333")
      .text(
        `Dirección: ${order.address ?? "Sin dirección"}, ${order.city ?? ""}, ${order.department ?? ""}`,
        left + 285,
        y + 45,
        { width: 230 }
      );

    if (order.reference) {
      doc.text(`Referencia: ${order.reference}`, left + 285, y + 79, {
        width: 230,
      });
    }

    y += 155;

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#111111")
      .text("Resumen del pedido", left, y);

    y += 30;

    doc.roundedRect(left, y, pageWidth - 100, 34, 10).fill("#111111");

    doc
      .fillColor("#ffffff")
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("Producto", left + 15, y + 12)
      .text("Cant.", left + 315, y + 12)
      .text("Precio", left + 375, y + 12)
      .text("Subtotal", left + 455, y + 12);

    y += 44;

    order.order_items?.forEach((item) => {
      const subtotal = Number(item.price ?? 0) * Number(item.quantity ?? 0);

      doc
        .fillColor("#111111")
        .fontSize(10)
        .font("Helvetica")
        .text(item.name, left + 15, y, { width: 270 })
        .text(String(item.quantity), left + 315, y)
        .text(formatCurrency(Number(item.price ?? 0)), left + 375, y)
        .text(formatCurrency(subtotal), left + 455, y);

      y += 28;

      doc
        .strokeColor("#e5e5e5")
        .lineWidth(1)
        .moveTo(left, y - 8)
        .lineTo(right, y - 8)
        .stroke();
    });

    y += 20;

    doc.roundedRect(right - 190, y, 190, 72, 12).fill("#111111");

    doc
      .fillColor("#ffffff")
      .fontSize(10)
      .font("Helvetica")
      .text("Total", right - 170, y + 18);

    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(formatCurrency(Number(order.total ?? 0)), right - 170, y + 36);

    y += 120;

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#666666")
      .text(
        "Este documento funciona como comprobante interno del pedido registrado en Samora Studio. No reemplaza una factura electrónica si esta es requerida legalmente.",
        left,
        y,
        { width: pageWidth - 100, align: "center" }
      );

    doc.end();

    const pdfBuffer = await bufferPromise;

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="comprobante-${order.order_code}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generando PDF:", error);

    return Response.json(
      { error: "Error generando el comprobante PDF." },
      { status: 500 }
    );
  }
}