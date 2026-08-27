"use client";

import { useState } from "react";

const inputClass =
  "min-h-12 w-full rounded-[0.9rem] border border-white/10 bg-black px-4 py-3 text-base text-white outline-none placeholder:text-white/30 focus:border-white/40 md:text-sm";

function getSuggestedPrice(cost: number, markupPercent: number) {
  if (cost <= 0) return 0;

  return Math.ceil((cost * (1 + markupPercent / 100)) / 1000) * 1000;
}

export default function VariantPricingFields({
  defaultCost = 0,
  defaultMarkup = 30,
  defaultPrice = 0,
}: {
  defaultCost?: number;
  defaultMarkup?: number;
  defaultPrice?: number;
}) {
  const [cost, setCost] = useState(String(defaultCost || ""));
  const [markup, setMarkup] = useState(String(defaultMarkup ?? 30));
  const [price, setPrice] = useState(
    String(defaultPrice || getSuggestedPrice(defaultCost, defaultMarkup) || "")
  );

  function recalculate(nextCost: string, nextMarkup: string) {
    const costNumber = Math.max(Number(nextCost) || 0, 0);
    const markupNumber = Math.max(Number(nextMarkup) || 0, 0);

    const suggested = getSuggestedPrice(costNumber, markupNumber);
    setPrice(suggested > 0 ? String(suggested) : "");
  }

  function handleCostChange(value: string) {
    setCost(value);
    recalculate(value, markup);
  }

  function handleMarkupChange(value: string) {
    setMarkup(value);
    recalculate(cost, value);
  }

  return (
    <>
      <label className="block">
        <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/35">
          Costo proveedor
        </span>
        <input
          name="supplier_cost_cop"
          type="number"
          min="0"
          step="1"
          value={cost}
          onChange={(event) => handleCostChange(event.target.value)}
          placeholder="Ej: 41000"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/35">
          Margen %
        </span>
        <input
          name="markup_percent"
          type="number"
          min="0"
          step="1"
          value={markup}
          onChange={(event) => handleMarkupChange(event.target.value)}
          placeholder="Ej: 30"
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/35">
          Precio Samora
        </span>
        <input
          name="price_cop"
          type="number"
          min="0"
          step="1"
          required
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="Se calcula automáticamente"
          className={inputClass}
        />
        <span className="mt-2 block text-[11px] leading-4 text-white/30">
          Se recalcula al cambiar costo o margen y se redondea al siguiente $1.000. Puedes ajustarlo manualmente.
        </span>
      </label>
    </>
  );
}
