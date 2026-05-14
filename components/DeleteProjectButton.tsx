"use client";

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
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

    alert("Proyecto eliminado");
    window.location.reload();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-400 transition hover:text-red-300"
    >
      Eliminar
    </button>
  );
}