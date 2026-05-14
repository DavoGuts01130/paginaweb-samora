import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
};

export default async function MiCuentaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      order_code,
      total,
      status,
      created_at,
      order_items (
        id,
        name,
        price,
        quantity,
        image_url
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:py-14">
          <div className="animate-fade-up">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Cuenta
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] md:text-6xl">
              Mi cuenta
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-white/55 md:text-lg md:leading-8">
              Consulta tus datos, revisa tus pedidos y realiza seguimiento de
              tus compras.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <aside className="premium-card rounded-[1.5rem] p-5 sm:p-6 lg:sticky lg:top-28">
              <div className="flex flex-col gap-2 border-b border-white/10 pb-5">
                <h2 className="text-2xl font-semibold">Datos personales</h2>
                <p className="text-sm leading-6 text-white/45">
                  Información asociada a tu cuenta y usada para pedidos.
                </p>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <Info label="Correo" value={user.email ?? "Sin correo"} />
                <Info
                  label="Nombre"
                  value={profile?.full_name ?? "Sin nombre"}
                />
                <Info
                  label="Teléfono"
                  value={profile?.phone ?? "Sin teléfono"}
                />
                <Info
                  label="Departamento"
                  value={profile?.department ?? "Sin departamento"}
                />
                <Info
                  label="Ciudad / Municipio"
                  value={profile?.city ?? "Sin ciudad"}
                />
                <Info
                  label="Dirección"
                  value={profile?.address ?? "Sin dirección"}
                />
                <Info
                  label="Referencia"
                  value={profile?.reference ?? "Sin referencia"}
                />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  href="/mi-cuenta/editar"
                  className="premium-button flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-center text-sm font-medium text-black transition hover:scale-[1.02]"
                >
                  Editar datos
                </Link>

                <LogoutButton />
              </div>
            </aside>

            <section className="premium-card rounded-[1.5rem] p-5 sm:p-6">
              <div className="flex flex-col gap-2 border-b border-white/10 pb-5">
                <h2 className="text-2xl font-semibold">Mis pedidos</h2>
                <p className="text-sm leading-6 text-white/45">
                  Revisa tus compras, productos y el estado actual de cada
                  pedido.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {orders && orders.length > 0 ? (
                  orders.map((order) => (
                    <article
                      key={order.id}
                      className="rounded-2xl border border-white/10 bg-black p-4 sm:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                            Pedido
                          </p>

                          <h3 className="mt-1 break-words text-lg font-semibold sm:text-xl">
                            {order.order_code}
                          </h3>

                          <p className="mt-2 text-sm text-white/45">
                            {new Date(order.created_at).toLocaleDateString(
                              "es-CO"
                            )}
                          </p>
                        </div>

                        <div className="shrink-0 sm:text-right">
                          <StatusBadge status={order.status} />

                          <p className="mt-3 text-xl font-bold">
                            ${Number(order.total).toLocaleString("es-CO")}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 space-y-3 border-t border-white/10 pt-5">
                        {order.order_items && order.order_items.length > 0 ? (
                          order.order_items.map((item: OrderItem) => (
                            <div
                              key={item.id}
                              className="flex gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0"
                            >
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                                />
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {item.name}
                                </p>
                                <p className="text-xs text-white/40">
                                  Cantidad: {item.quantity}
                                </p>
                              </div>

                              <p className="shrink-0 text-sm font-semibold">
                                $
                                {(
                                  Number(item.price) * Number(item.quantity)
                                ).toLocaleString("es-CO")}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-white/45">
                            No hay productos asociados a este pedido.
                          </p>
                        )}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <Link
                          href={`/seguimiento?code=${order.order_code}`}
                          className="flex min-h-11 items-center justify-center rounded-full border border-white/20 px-5 py-2 text-sm text-white/70 transition hover:bg-white hover:text-black"
                        >
                          Rastrear pedido →
                        </Link>

                        <a
                          href={`/api/orders/receipt?code=${encodeURIComponent(
                            order.order_code
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:scale-[1.02]"
                        >
                          Ver comprobante
                        </a>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black p-8 text-center">
                    <p className="text-white/45">
                      Aún no tienes pedidos asociados a tu cuenta.
                    </p>

                    <Link
                      href="/tienda"
                      className="premium-button mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                    >
                      Ir a la tienda
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/40">{label}</p>
      <p className="mt-1 break-words font-medium text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "pendiente"
      ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-400"
      : status === "en proceso"
      ? "border-blue-400/30 bg-blue-400/10 text-blue-400"
      : status === "entregado"
      ? "border-green-400/30 bg-green-400/10 text-green-400"
      : status === "cancelado"
      ? "border-red-400/30 bg-red-400/10 text-red-400"
      : "border-white/10 bg-white/5 text-white/50";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles}`}
    >
      {status}
    </span>
  );
}