"use client";

export default function PrintProposalButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
    >
      Imprimir / guardar PDF
    </button>
  );
}
