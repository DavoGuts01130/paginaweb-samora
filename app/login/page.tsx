import Navbar from "@/components/Navbar";
import LoginButton from "@/components/LoginButton";

export default function LoginPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-4xl items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
          <div className="premium-card w-full max-w-2xl rounded-[2rem] p-6 text-center sm:p-8 md:p-12">
            <p className="text-xs uppercase tracking-[0.35em] text-white/35 sm:text-sm">
              Samora Studio
            </p>

            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] sm:text-5xl md:text-6xl">
              Inicia sesión
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
              Accede al panel de administración y gestiona proyectos,
              servicios, pedidos y contenido del sitio.
            </p>

            <div className="mt-10 flex justify-center">
              <LoginButton />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}