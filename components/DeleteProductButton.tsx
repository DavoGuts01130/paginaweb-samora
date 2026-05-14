"use client";

import { useRouter } from "next/navigation";

export default function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    const confirmDelete = confirm("¿Eliminar este producto?");
    if (!confirmDelete) return;

    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      alert("Error eliminando producto");
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-400 transition hover:text-red-300"
    >
      Eliminar →
    </button>
  );
}