type EmailProduct = {
  name: string;
  price: number;
  quantity: number;
};

type OrderEmailData = {
  orderCode: string;
  customerName: string;
  total: number;
  products: EmailProduct[];
  address?: string;
  city?: string;
  department?: string;
  status?: string;
  message?: string;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://samora.vercel.app";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function productsList(products: EmailProduct[]) {
  return products
    .map(
      (item) => `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid #222;color:#f5f5f5;">
            ${item.name}
            <div style="margin-top:4px;color:#888;font-size:13px;">Cantidad: ${item.quantity}</div>
          </td>
          <td style="padding:14px 0;border-bottom:1px solid #222;text-align:right;color:#f5f5f5;">
            ${currency.format(Number(item.price) * Number(item.quantity))}
          </td>
        </tr>
      `
    )
    .join("");
}

function baseTemplate(content: string) {
  return `
    <div style="margin:0;padding:0;background:#050505;font-family:Arial,Helvetica,sans-serif;color:#f5f5f5;">
      <div style="max-width:680px;margin:0 auto;padding:40px 20px;">
        <div style="padding:28px;border:1px solid #1f1f1f;border-radius:28px;background:#0b0b0b;">
          <div style="text-align:center;margin-bottom:32px;">
            <p style="margin:0;color:#888;font-size:12px;letter-spacing:5px;text-transform:uppercase;">
              Samora Studio
            </p>
            <h1 style="margin:14px 0 0;font-size:30px;line-height:1.1;color:#fff;">
              Fotografía con intención
            </h1>
          </div>

          ${content}

          <div style="margin-top:34px;padding-top:22px;border-top:1px solid #222;text-align:center;">
            <p style="margin:0;color:#777;font-size:13px;line-height:1.7;">
              Este correo fue enviado automáticamente por Samora Studio.<br/>
              Gracias por confiar en nosotros.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function customerOrderConfirmationEmail(data: OrderEmailData) {
  const trackingUrl = `${SITE_URL}/seguimiento?code=${data.orderCode}`;

  return baseTemplate(`
    <p style="margin:0 0 12px;color:#999;font-size:15px;">Hola ${data.customerName},</p>

    <h2 style="margin:0 0 14px;font-size:26px;color:#fff;">
      Tu pedido fue registrado correctamente.
    </h2>

    <p style="margin:0;color:#aaa;line-height:1.7;font-size:15px;">
      Recibimos tu compra y pronto nos pondremos en contacto para coordinar los detalles de entrega.
    </p>

    <div style="margin-top:26px;padding:18px;border:1px solid #242424;border-radius:20px;background:#111;">
      <p style="margin:0;color:#777;font-size:12px;text-transform:uppercase;letter-spacing:3px;">Código de pedido</p>
      <p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:bold;">${data.orderCode}</p>
    </div>

    <table style="width:100%;margin-top:26px;border-collapse:collapse;">
      ${productsList(data.products)}
    </table>

    <div style="margin-top:24px;text-align:right;">
      <p style="margin:0;color:#777;font-size:13px;">Total</p>
      <p style="margin:6px 0 0;color:#fff;font-size:26px;font-weight:bold;">
        ${currency.format(data.total)}
      </p>
    </div>

    <div style="margin-top:28px;padding:18px;border-radius:20px;background:#111;border:1px solid #242424;">
      <p style="margin:0 0 8px;color:#777;font-size:13px;">Dirección de entrega</p>
      <p style="margin:0;color:#ddd;line-height:1.6;">
        ${data.address ?? ""}, ${data.city ?? ""}, ${data.department ?? ""}
      </p>
    </div>

    <div style="margin-top:30px;text-align:center;">
      <a href="${trackingUrl}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#ffffff;color:#000;text-decoration:none;font-weight:bold;font-size:14px;">
        Rastrear pedido
      </a>
    </div>
  `);
}

export function adminNewOrderEmail(data: OrderEmailData & {
  customerEmail: string;
  customerPhone: string;
  linkedUser?: string;
}) {
  const trackingUrl = `${SITE_URL}/seguimiento?code=${data.orderCode}`;

  return baseTemplate(`
    <h2 style="margin:0 0 14px;font-size:26px;color:#fff;">
      Nuevo pedido recibido
    </h2>

    <p style="margin:0;color:#aaa;line-height:1.7;font-size:15px;">
      Se registró una nueva compra en la tienda.
    </p>

    <div style="margin-top:26px;padding:18px;border:1px solid #242424;border-radius:20px;background:#111;">
      <p style="margin:0;color:#777;font-size:12px;text-transform:uppercase;letter-spacing:3px;">Pedido</p>
      <p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:bold;">${data.orderCode}</p>
    </div>

    <div style="margin-top:22px;line-height:1.8;color:#ddd;">
      <p><strong>Cliente:</strong> ${data.customerName}</p>
      <p><strong>Correo:</strong> ${data.customerEmail}</p>
      <p><strong>Teléfono:</strong> ${data.customerPhone}</p>
      <p><strong>Usuario asociado:</strong> ${data.linkedUser ?? "Compra sin cuenta"}</p>
    </div>

    <table style="width:100%;margin-top:22px;border-collapse:collapse;">
      ${productsList(data.products)}
    </table>

    <div style="margin-top:24px;text-align:right;">
      <p style="margin:0;color:#777;font-size:13px;">Total</p>
      <p style="margin:6px 0 0;color:#fff;font-size:26px;font-weight:bold;">
        ${currency.format(data.total)}
      </p>
    </div>

    <div style="margin-top:30px;text-align:center;">
      <a href="${trackingUrl}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#ffffff;color:#000;text-decoration:none;font-weight:bold;font-size:14px;">
        Ver seguimiento
      </a>
    </div>
  `);
}

export function statusUpdateEmail(data: OrderEmailData) {
  const trackingUrl = `${SITE_URL}/seguimiento?code=${data.orderCode}`;

  return baseTemplate(`
    <p style="margin:0 0 12px;color:#999;font-size:15px;">Hola ${data.customerName},</p>

    <h2 style="margin:0 0 14px;font-size:26px;color:#fff;">
      Actualización de tu pedido
    </h2>

    <p style="margin:0;color:#aaa;line-height:1.7;font-size:15px;">
      ${data.message}
    </p>

    <div style="margin-top:26px;padding:18px;border:1px solid #242424;border-radius:20px;background:#111;">
      <p style="margin:0;color:#777;font-size:12px;text-transform:uppercase;letter-spacing:3px;">Estado actual</p>
      <p style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:bold;text-transform:capitalize;">
        ${data.status}
      </p>
    </div>

    <table style="width:100%;margin-top:26px;border-collapse:collapse;">
      ${productsList(data.products)}
    </table>

    <div style="margin-top:24px;text-align:right;">
      <p style="margin:0;color:#777;font-size:13px;">Total</p>
      <p style="margin:6px 0 0;color:#fff;font-size:26px;font-weight:bold;">
        ${currency.format(data.total)}
      </p>
    </div>

    <div style="margin-top:30px;text-align:center;">
      <a href="${trackingUrl}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#ffffff;color:#000;text-decoration:none;font-weight:bold;font-size:14px;">
        Rastrear pedido
      </a>
    </div>
  `);
}