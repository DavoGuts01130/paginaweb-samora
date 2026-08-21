type Props = {
  status: string | null | undefined;
  type?: "order" | "payment" | "delivery" | "quote" | "reservation";
};

const base =
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap";

const labels: Record<string, string> = {
  new: "Nuevo",
  pending_payment: "Pendiente de pago",
  paid: "Pagado",
  preparing: "Preparando",
  ready: "Listo para entrega",
  delivered: "Entregado",
  completed: "Finalizado",
  cancelled: "Cancelado",
  failed: "Fallido",
  refunded: "Reembolsado",
  not_required: "No requerido",
  pending: "Pendiente",
  coordinating: "Coordinando",
  ready_for_delivery: "Lista",
  proposal_sent: "Propuesta enviada",
  approved: "Aprobada",
  reserved: "Reservada",
  reviewing: "En revisión",
  travel_review: "Revisión desplazamiento",
  pending_deposit: "Pendiente de abono",
  no_deposit_required: "Sin abono requerido",

  // Compatibilidad con estados antiguos
  pendiente: "Pendiente",
  "en proceso": "En proceso",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

function getTone(status: string) {
  if (
    [
      "pending",
      "pending_payment",
      "pending_deposit",
      "new",
      "pendiente",
    ].includes(status)
  ) {
    return "border-yellow-400/30 bg-yellow-400/10 text-yellow-400";
  }

  if (
    ["reviewing", "travel_review", "preparing", "coordinating", "en proceso"].includes(
      status
    )
  ) {
    return "border-blue-400/30 bg-blue-400/10 text-blue-400";
  }

  if (
    [
      "paid",
      "approved",
      "reserved",
      "ready",
      "ready_for_delivery",
      "delivered",
      "completed",
      "entregado",
    ].includes(status)
  ) {
    return "border-green-400/30 bg-green-400/10 text-green-400";
  }

  if (["cancelled", "failed", "cancelado"].includes(status)) {
    return "border-red-400/30 bg-red-400/10 text-red-400";
  }

  if (["refunded", "not_required", "no_deposit_required"].includes(status)) {
    return "border-purple-400/30 bg-purple-400/10 text-purple-300";
  }

  return "border-white/10 bg-white/5 text-white/50";
}

export default function OrderStatusBadge({ status }: Props) {
  const safeStatus = status || "pending";

  return (
    <span className={`${base} ${getTone(safeStatus)}`}>
      {labels[safeStatus] ?? safeStatus}
    </span>
  );
}
