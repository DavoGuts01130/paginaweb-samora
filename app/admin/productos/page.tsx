import Link from "next/link";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import CreateProductForm from "@/components/CreateProductForm";
import DeleteProductButton from "@/components/DeleteProductButton";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProductosPage() {
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

  const { data: products } = await supabase
    .from("products")
    .select(
      "id, name, title, slug, description, price, image_url, stock, is_active, image_fit, image_zoom, image_x, image_y"
    )
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto max-w-7xl px-6 py-12">
          <Link
            href="/admin"
            className="text-sm text-white/50 transition hover:text-white"
          >
            ← Volver al panel
          </Link>

          <div className="mt-8">
            <p className="text-sm uppercase tracking-[0.35em] text-white/35">
              Administración
            </p>

            <h1 className="mt-4 text-4xl font-bold md:text-6xl">
              Productos
            </h1>

            <p className="mt-4 max-w-2xl text-white/55">
              Crea, edita y gestiona productos de la tienda de Samora.
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <CreateProductForm />

            <div>
              <h2 className="text-2xl font-semibold">Productos existentes</h2>

              <div className="mt-6 space-y-4">
                {products && products.length > 0 ? (
                  products.map((product) => {
                    const productName =
                      product.name ?? product.title ?? "Producto sin nombre";

                    const imageFit = product.image_fit ?? "cover";
                    const imageZoom = Number(product.image_zoom ?? 1);
                    const imageX = Number(product.image_x ?? 50);
                    const imageY = Number(product.image_y ?? 50);

                    return (
                      <div
                        key={product.id}
                        className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5 transition hover:border-white/20"
                      >
                        <div className="flex gap-5">
                          {product.image_url && (
                            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-black">
                              <img
                                src={product.image_url}
                                alt={productName}
                                className="h-full w-full"
                                style={{
                                  objectFit: imageFit,
                                  objectPosition: `${imageX}% ${imageY}%`,
                                  transform: `scale(${imageZoom})`,
                                }}
                              />
                            </div>
                          )}

                          <div className="flex-1">
                            <p className="text-xs uppercase tracking-[0.25em] text-white/35">
                              {product.is_active ? "Activo" : "Oculto"}
                            </p>

                            <h3 className="mt-2 text-xl font-semibold">
                              {productName}
                            </h3>

                            <p className="mt-1 text-sm text-white/45">
                              ${Number(product.price ?? 0).toLocaleString("es-CO")} · Stock:{" "}
                              {product.stock ?? 0}
                            </p>

                            <p className="mt-3 line-clamp-2 text-sm text-white/45">
                              {product.description || "Sin descripción"}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-4">
                              {product.slug && (
                                <Link
                                  href={`/tienda/${product.slug}`}
                                  className="text-sm text-white/70 transition hover:text-white"
                                >
                                  Ver producto →
                                </Link>
                              )}

                              <Link
                                href={`/admin/productos/${product.id}/editar`}
                                className="text-sm text-white/70 transition hover:text-white"
                              >
                                Editar →
                              </Link>

                              <DeleteProductButton id={product.id} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-white/50">Aún no hay productos.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}