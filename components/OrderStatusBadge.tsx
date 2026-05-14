type Props = {
  status: string;
};

export default function OrderStatusBadge({ status }: Props) {
  const base =
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap";

  if (status === "pendiente") {
    return (
      <span
        className={`${base} border-yellow-400/30 bg-yellow-400/10 text-yellow-400`}
      >
        Pendiente
      </span>
    );
  }

  if (status === "en proceso") {
    return (
      <span
        className={`${base} border-blue-400/30 bg-blue-400/10 text-blue-400`}
      >
        En proceso
      </span>
    );
  }

  if (status === "entregado") {
    return (
      <span
        className={`${base} border-green-400/30 bg-green-400/10 text-green-400`}
      >
        Entregado
      </span>
    );
  }

  if (status === "cancelado") {
    return (
      <span
        className={`${base} border-red-400/30 bg-red-400/10 text-red-400`}
      >
        Cancelado
      </span>
    );
  }

  return (
    <span className={`${base} border-white/10 bg-white/5 text-white/50`}>
      {status}
    </span>
  );
}