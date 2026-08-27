"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  buildRuleKey,
  calculateConfiguredPrice,
  getConfigurationPriceRange,
  normalizeConfiguration,
  type ConfigPricingRule,
  type ConfigQuantity,
  type ConfigSelector,
  type ProductConfiguration,
} from "@/lib/product-config";

type SelectorDraft = {
  id: string;
  label: string;
  valuesText: string;
};

const inputClass =
  "min-h-12 w-full rounded-[0.9rem] border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/40";

function formatCOP(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString("es-CO")}`;
}

function parseValues(text: string) {
  return Array.from(
    new Set(
      text
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function toSelectorDrafts(selectors: ConfigSelector[]): SelectorDraft[] {
  return selectors.map((selector) => ({
    id: selector.id,
    label: selector.label,
    valuesText: selector.values.join(", "),
  }));
}

function createSelectorId() {
  return `selector_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function createCombinations(selectors: ConfigSelector[]) {
  if (selectors.length === 0) {
    return [{ key: "default", selections: {} as Record<string, string> }];
  }

  if (selectors.some((selector) => selector.values.length === 0)) {
    return [];
  }

  let combinations: Record<string, string>[] = [{}];

  for (const selector of selectors) {
    combinations = combinations.flatMap((current) =>
      selector.values.map((value) => ({
        ...current,
        [selector.id]: value,
      }))
    );
  }

  return combinations.map((selections) => ({
    key: buildRuleKey(selectors, selections),
    selections,
  }));
}

function getCombinationLabel(
  selectors: ConfigSelector[],
  selections: Record<string, string>
) {
  if (selectors.length === 0) return "Precio base";

  return selectors
    .map((selector) => selections[selector.id] ?? "")
    .filter(Boolean)
    .join(" + ");
}

const defaultQuantity: ConfigQuantity = {
  id: "quantity",
  label: "Número de hojas",
  min: 6,
  max: 25,
  step: 1,
  base: 6,
};

export default function ProductConfiguratorAdmin({
  productId,
  initialConfiguration,
}: {
  productId: string;
  initialConfiguration: ProductConfiguration | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const normalizedInitial = normalizeConfiguration(initialConfiguration);

  const [selectors, setSelectors] = useState<SelectorDraft[]>(
    toSelectorDrafts(normalizedInitial?.selectors ?? [])
  );
  const [quantityEnabled, setQuantityEnabled] = useState(
    Boolean(normalizedInitial?.quantity_config)
  );
  const [quantity, setQuantity] = useState<ConfigQuantity>(
    normalizedInitial?.quantity_config ?? defaultQuantity
  );
  const [rules, setRules] = useState<ConfigPricingRule[]>(
    normalizedInitial?.pricing_rules ?? []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const normalizedSelectors = useMemo<ConfigSelector[]>(
    () =>
      selectors
        .map((selector) => ({
          id: selector.id,
          label: selector.label.trim(),
          values: parseValues(selector.valuesText),
        }))
        .filter((selector) => selector.label),
    [selectors]
  );

  const combinations = useMemo(
    () => createCombinations(normalizedSelectors),
    [normalizedSelectors]
  );

  useEffect(() => {
    setRules((currentRules) =>
      combinations.map((combination) => {
        const existing = currentRules.find(
          (rule) => rule.key === combination.key
        );

        return (
          existing ?? {
            key: combination.key,
            selections: combination.selections,
            supplier_base_cost_cop: 0,
            supplier_increment_cost_cop: 0,
            markup_percent: 30,
          }
        );
      })
    );
  }, [combinations]);

  const previewConfiguration = useMemo<ProductConfiguration>(
    () => ({
      product_id: productId,
      selectors: normalizedSelectors,
      quantity_config: quantityEnabled ? quantity : null,
      pricing_rules: rules,
      is_active: true,
    }),
    [normalizedSelectors, productId, quantity, quantityEnabled, rules]
  );

  const priceRange = getConfigurationPriceRange(previewConfiguration);

  function updateSelector(
    id: string,
    field: "label" | "valuesText",
    value: string
  ) {
    setSelectors((current) =>
      current.map((selector) =>
        selector.id === id ? { ...selector, [field]: value } : selector
      )
    );
  }

  function addSelector() {
    if (selectors.length >= 2) return;

    setSelectors((current) => [
      ...current,
      {
        id: createSelectorId(),
        label: "",
        valuesText: "",
      },
    ]);
  }

  function removeSelector(id: string) {
    setSelectors((current) =>
      current.filter((selector) => selector.id !== id)
    );
  }

  function updateRule(
    key: string,
    field:
      | "supplier_base_cost_cop"
      | "supplier_increment_cost_cop"
      | "markup_percent",
    value: number
  ) {
    setRules((current) =>
      current.map((rule) =>
        rule.key === key
          ? {
              ...rule,
              [field]: Math.max(Number(value) || 0, 0),
            }
          : rule
      )
    );
  }

  function applyPreset(
    preset:
      | "design-paper-pages"
      | "size-pages"
      | "cover-pages"
      | "pages-only"
  ) {
    if (preset === "design-paper-pages") {
      setSelectors([
        {
          id: "design",
          label: "Diseño",
          valuesText: "Plantilla, Personalizado",
        },
        {
          id: "paper",
          label: "Tipo de hoja",
          valuesText: "Mate, Seda",
        },
      ]);
      setQuantityEnabled(true);
      setQuantity(defaultQuantity);
      setRules([]);
      return;
    }

    if (preset === "size-pages") {
      setSelectors([
        {
          id: "size",
          label: "Tamaño",
          valuesText: "20x20, 25x25, 30x30",
        },
      ]);
      setQuantityEnabled(true);
      setQuantity(defaultQuantity);
      setRules([]);
      return;
    }

    if (preset === "cover-pages") {
      setSelectors([
        {
          id: "cover",
          label: "Portada",
          valuesText: "Opción 1, Opción 2",
        },
      ]);
      setQuantityEnabled(true);
      setQuantity(defaultQuantity);
      setRules([]);
      return;
    }

    setSelectors([]);
    setQuantityEnabled(true);
    setQuantity(defaultQuantity);
    setRules([]);
  }

  async function saveConfiguration() {
    setMessage("");

    if (selectors.some((selector) => !selector.label.trim())) {
      setMessage("Completa el nombre de cada selector.");
      return;
    }

    if (
      normalizedSelectors.some((selector) => selector.values.length === 0)
    ) {
      setMessage("Cada selector necesita al menos una opción.");
      return;
    }

    if (
      quantityEnabled &&
      (quantity.min < 0 ||
        quantity.max < quantity.min ||
        quantity.base < quantity.min ||
        quantity.base > quantity.max ||
        quantity.step <= 0)
    ) {
      setMessage("Revisa mínimo, máximo, base y paso de la cantidad.");
      return;
    }

    if (combinations.length === 0 || rules.length === 0) {
      setMessage("La configuración todavía no tiene reglas de precio.");
      return;
    }

    const incompleteRule = rules.find(
      (rule) => Number(rule.supplier_base_cost_cop ?? 0) <= 0
    );

    if (incompleteRule) {
      setMessage("Cada combinación necesita un costo base de proveedor.");
      return;
    }

    setIsSaving(true);

    const payload = {
      product_id: productId,
      selectors: normalizedSelectors,
      quantity_config: quantityEnabled ? quantity : null,
      pricing_rules: rules,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("product_configurations")
      .upsert(payload, { onConflict: "product_id" });

    if (error) {
      setMessage(`Error guardando configuración: ${error.message}`);
      setIsSaving(false);
      return;
    }

    const { error: productError } = await supabase
      .from("products")
      .update({
        product_type: "configurable",
        has_variants: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId);

    if (productError) {
      setMessage(`Configuración guardada, pero no se pudo actualizar el producto: ${productError.message}`);
      setIsSaving(false);
      return;
    }

    setMessage("Configuración guardada correctamente.");
    setIsSaving(false);
    router.refresh();
  }

  return (
    <div>
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/30">
          Plantillas rápidas
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <PresetButton
            onClick={() => applyPreset("design-paper-pages")}
            text="Diseño + hoja + cantidad"
          />
          <PresetButton
            onClick={() => applyPreset("size-pages")}
            text="Tamaño + cantidad"
          />
          <PresetButton
            onClick={() => applyPreset("cover-pages")}
            text="Portada + cantidad"
          />
          <PresetButton
            onClick={() => applyPreset("pages-only")}
            text="Solo cantidad"
          />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {selectors.map((selector, index) => (
          <div
            key={selector.id}
            className="rounded-2xl border border-white/10 bg-black/40 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Selector {index + 1}
              </p>

              <button
                type="button"
                onClick={() => removeSelector(selector.id)}
                className="text-xs text-red-300 transition hover:text-red-200"
              >
                Eliminar
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-[0.75fr_1.25fr]">
              <label>
                <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/35">
                  Nombre
                </span>
                <input
                  value={selector.label}
                  onChange={(event) =>
                    updateSelector(selector.id, "label", event.target.value)
                  }
                  placeholder="Ej: Diseño"
                  className={inputClass}
                />
              </label>

              <label>
                <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-white/35">
                  Opciones separadas por coma
                </span>
                <input
                  value={selector.valuesText}
                  onChange={(event) =>
                    updateSelector(
                      selector.id,
                      "valuesText",
                      event.target.value
                    )
                  }
                  placeholder="Ej: Plantilla, Personalizado"
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        ))}

        {selectors.length < 2 && (
          <button
            type="button"
            onClick={addSelector}
            className="min-h-11 rounded-full border border-dashed border-white/15 px-5 py-2.5 text-sm text-white/55 transition hover:border-white/35 hover:text-white"
          >
            + Agregar selector
          </button>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
        <label className="flex items-center gap-3 text-sm text-white/65">
          <input
            type="checkbox"
            checked={quantityEnabled}
            onChange={(event) => setQuantityEnabled(event.target.checked)}
          />
          El precio también depende de una cantidad configurable
        </label>

        {quantityEnabled && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <ConfigNumberField
              label="Nombre"
              text
              value={quantity.label}
              onChange={(value) =>
                setQuantity((current) => ({ ...current, label: value }))
              }
              placeholder="Número de hojas"
            />
            <ConfigNumberField
              label="Mínimo"
              value={quantity.min}
              onChange={(value) =>
                setQuantity((current) => ({ ...current, min: Number(value) }))
              }
            />
            <ConfigNumberField
              label="Máximo"
              value={quantity.max}
              onChange={(value) =>
                setQuantity((current) => ({ ...current, max: Number(value) }))
              }
            />
            <ConfigNumberField
              label="Cantidad base"
              value={quantity.base}
              onChange={(value) =>
                setQuantity((current) => ({ ...current, base: Number(value) }))
              }
            />
            <ConfigNumberField
              label="Paso"
              value={quantity.step}
              onChange={(value) =>
                setQuantity((current) => ({ ...current, step: Number(value) }))
              }
            />
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/30">
              Reglas de precio
            </p>
            <h3 className="mt-2 text-xl font-semibold">
              Costos por combinación
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/40">
              Introduce el costo del proveedor y el margen. Samora calcula el
              precio final según la combinación y la cantidad elegida.
            </p>
          </div>

          {priceRange.min > 0 && (
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-3 text-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-200/55">
                Rango Samora
              </p>
              <p className="mt-1 font-semibold text-emerald-100">
                {priceRange.min === priceRange.max
                  ? formatCOP(priceRange.min)
                  : `${formatCOP(priceRange.min)} - ${formatCOP(
                      priceRange.max
                    )}`}
              </p>
            </div>
          )}
        </div>

        {rules.length > 0 ? (
          <div className="mt-5 space-y-3">
            {rules.map((rule) => {
              const minPrice = calculateConfiguredPrice(
                rule,
                quantityEnabled ? quantity : null,
                quantityEnabled ? quantity.min : null
              );
              const maxPrice = calculateConfiguredPrice(
                rule,
                quantityEnabled ? quantity : null,
                quantityEnabled ? quantity.max : null
              );

              return (
                <div
                  key={rule.key}
                  className="rounded-2xl border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium">
                      {getCombinationLabel(
                        normalizedSelectors,
                        rule.selections
                      )}
                    </p>

                    <p className="text-xs text-white/40">
                      Samora:{" "}
                      <span className="text-white/70">
                        {minPrice === maxPrice
                          ? formatCOP(minPrice)
                          : `${formatCOP(minPrice)} - ${formatCOP(maxPrice)}`}
                      </span>
                    </p>
                  </div>

                  <div
                    className={`mt-4 grid gap-4 ${
                      quantityEnabled
                        ? "sm:grid-cols-3"
                        : "sm:grid-cols-2"
                    }`}
                  >
                    <PriceField
                      label={
                        quantityEnabled
                          ? `Costo proveedor en ${quantity.base}`
                          : "Costo proveedor"
                      }
                      value={rule.supplier_base_cost_cop}
                      onChange={(value) =>
                        updateRule(
                          rule.key,
                          "supplier_base_cost_cop",
                          value
                        )
                      }
                    />

                    {quantityEnabled && (
                      <PriceField
                        label={`Costo por cada +${quantity.step}`}
                        value={rule.supplier_increment_cost_cop}
                        onChange={(value) =>
                          updateRule(
                            rule.key,
                            "supplier_increment_cost_cop",
                            value
                          )
                        }
                      />
                    )}

                    <PriceField
                      label="Margen %"
                      value={rule.markup_percent}
                      onChange={(value) =>
                        updateRule(rule.key, "markup_percent", value)
                      }
                      money={false}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.06] p-4 text-sm leading-6 text-yellow-100/70">
            Completa las opciones de los selectores para generar las reglas de
            precio.
          </div>
        )}
      </div>

      {message && (
        <p className="mt-5 rounded-2xl border border-white/10 bg-black p-4 text-sm leading-6 text-white/55">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={saveConfiguration}
        disabled={isSaving}
        className="mt-6 min-h-12 w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? "Guardando..." : "Guardar configuración"}
      </button>
    </div>
  );
}

function PresetButton({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/55 transition hover:border-white/30 hover:text-white"
    >
      {text}
    </button>
  );
}

function PriceField({
  label,
  value,
  onChange,
  money = true,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  money?: boolean;
}) {
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  return (
    <label>
      <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/35">
        {label}
      </span>
      <input
        type="number"
        min="0"
        step="1"
        value={draftValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraftValue(nextValue);

          if (nextValue !== "") {
            onChange(Math.max(Number(nextValue) || 0, 0));
          }
        }}
        onBlur={() => {
          if (draftValue === "") {
            setDraftValue("0");
            onChange(0);
          }
        }}
        className={inputClass}
      />
      {money && Number(draftValue) > 0 && (
        <span className="mt-1 block text-[11px] text-white/25">
          {formatCOP(Number(draftValue))}
        </span>
      )}
    </label>
  );
}

function ConfigNumberField({
  label,
  value,
  onChange,
  text = false,
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  text?: boolean;
  placeholder?: string;
}) {
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  return (
    <label>
      <span className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-white/35">
        {label}
      </span>
      <input
        type={text ? "text" : "number"}
        min={text ? undefined : 0}
        step={text ? undefined : 1}
        value={draftValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraftValue(nextValue);

          if (text || nextValue !== "") {
            onChange(nextValue);
          }
        }}
        onBlur={() => {
          if (!text && draftValue === "") {
            setDraftValue("0");
            onChange("0");
          }
        }}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}
