import Navbar from "@/components/Navbar";

export default function Planes() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-black pt-24 text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <h1 className="text-4xl font-bold">Portafolio</h1>
          <p className="mt-4 text-neutral-400">
            Aquí irá el catálogo de trabajos del fotógrafo.
          </p>
        </div>
      </main>
    </>
  );
}