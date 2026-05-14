import Link from "next/link";
import Navbar from "@/components/Navbar";

type Props = {
  searchParams: Promise<{
    order?: string;
    code?: string;
  }>;
};

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const params = await searchParams;

  const orderId = params.order;
  const orderCode = params.code;
  const displayCode = orderCode || orderId;

  const whatsappNumber = "573192709536";

  const whatsappMessage = encodeURIComponent(
    `Hola, acabo de realizar el pedido ${
      displayCode ?? ""
    } y quisiera confirmar la información.`
  );

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black px-4 pt-24 text-white sm:px-6">
        <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-4xl items-center justify-center py-10 sm:py-16">
          <div className="premium-card w-full rounded-[2rem] p-6 text-center sm:p-8 md:p-12">
            {/* ICONO */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-bold text-black sm:h-20 sm:w-20 sm:text-3xl">
              ✓
            </div>

            {/* TITULO */}
            <h1 className="mt-6 text-3xl font-bold tracking-[-0.03em] sm:text-4xl md:text-5xl">
              ¡Compra confirmada!
            </h1>

            {/* DESCRIPCIÓN */}
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/60 sm:text-base sm:leading-8">
              Tu pedido ha sido registrado correctamente. Estamos preparando tu
              compra y nos pondremos en contacto contigo para coordinar la
              entrega.
            </p>

            {/* CÓDIGO DEL PEDIDO */}
            {displayCode && (
              <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-black p-4 sm:p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-white/35 sm:text-sm">
                  Número de pedido
                </p>

                <p className="mt-2 break-all text-base font-semibold sm:text-lg md:text-xl">
                  {displayCode}
                </p>
              </div>
            )}

            {/* INFORMACIÓN ADICIONAL */}
            <div className="mx-auto mt-8 max-w-md space-y-2 text-sm leading-6 text-white/50">
              <p>📦 Tiempo estimado de contacto: 24 horas</p>
              <p>📞 Te contactaremos vía WhatsApp o llamada</p>
            </div>

            {/* BOTONES */}
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {displayCode && (
                <Link
                  href={`/seguimiento?code=${displayCode}`}
                  className="premium-button inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                >
                  Rastrear pedido
                </Link>
              )}

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-green-500 px-6 py-3 text-sm font-medium text-green-400 transition hover:bg-green-500 hover:text-black"
              >
                💬 WhatsApp
              </a>

              <Link
                href="/tienda"
                className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm text-white/75 transition hover:bg-white hover:text-black"
              >
                Seguir comprando
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-3 text-sm text-white/70 transition hover:bg-white hover:text-black"
              >
                Ir al inicio
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}