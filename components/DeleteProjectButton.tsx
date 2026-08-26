"use client";

import { useRouter } from "next/navigation";

export default function DeleteProjectButton({
  projectId,
}: {
  projectId: string;
}) {
  const router = useRouter();

  async function handleDelete() {
    const confirmDelete = confirm(
      "¿Eliminar este proyecto y todas sus imágenes?"
    );

    if (!confirmDelete) return;

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Error eliminando proyecto");
      return;
    }

    router.push("/admin/portafolio");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-sm text-red-400 transition hover:text-red-300"
    >
      Eliminar proyecto
    </button>
  );
}
