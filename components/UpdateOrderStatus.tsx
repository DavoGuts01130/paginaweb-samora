"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const statuses = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en proceso", label: "En proceso" },
  { value: "entregado", label: "Entregado" },
  { value: "cancelado", label: "Cancelado" },
];

function getButtonClass(status: string, active: boolean) {
  if (!active) {
    return "border-white/10 bg-black text-white/45 hover:border-white/25 hover:text-white";
  }

  if (status === "pendiente") {
    return "border-yellow-400/40 bg-yellow-400/10 text-yellow-400";
  }

  if (status === "en proceso") {
    return "border-blue-400/40 bg-blue-400/10 text-blue-400";
  }

  if (status === "entregado") {
    return "border-green-400/40 bg-green-400/10 text-green-400";
  }

  if (status === "cancelado") {
    return "border-red-400/40 bg-red-400/10 text-red-400";
  }

  return "border-white/10 bg-black text-white";
}

export default function UpdateOrderStatus({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: string) {
    if (newStatus === status) return;

    setLoading(true);

    const previousStatus = status;
    setStatus(newStatus);

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      alert(`Error actualizando estado: ${error.message}`);
      setStatus(previousStatus);
      setLoading(false);
      return;
    }

    const emailResponse = await fetch("/api/orders/status-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        status: newStatus,
      }),
    });

    if (!emailResponse.ok) {
      alert(
        "El estado se actualizó, pero no se pudo enviar el correo de notificación."
      );
    } else {
      alert("Estado actualizado y notificación enviada.");
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {statuses.map((item) => {
        const active = status === item.value;

        return (
          <button
            key={item.value}
            type="button"
            disabled={loading}
            onClick={() => handleChange(item.value)}
            className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm ${getButtonClass(
              item.value,
              active
            )}`}
          >
            {loading && active ? "Actualizando..." : item.label}
          </button>
        );
      })}
    </div>
  );
}