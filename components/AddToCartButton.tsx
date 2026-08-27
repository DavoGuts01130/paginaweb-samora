"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import {
  buildRuleKey,
  buildSelectedOptions,
  calculateConfiguredPrice,
  getDefaultSelections,
  getRule,
  normalizeConfiguration,
  type ProductConfiguration,
} from "@/lib/product-config";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  stock?: number | null;
  product_category?: string | null;
  product_subcategory?: string | null;
};

export type ProductVariantForCart = {
  id: string;
  name: string | null;
  sku: string | null;
  option_1_label: string | null;
  option_1_value: string | null;
  option_2_label: string | null;
  option_2_value: string | null;
  price_cop: number | null;
  stock: number | null;
  is_active: boolean | null;
};

function formatCOP(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString("es-CO")}`;
}

function getVariantLabel(variant: ProductVariantForCart) {
  const first = [variant.option_1_label, variant.option_1_value]
    .filter(Boolean)
    .join(": ");

  const second = [variant.option_2_label, variant.option_2_value]
    .filter(Boolean)
    .join(": ");

  const parts = [variant.name, first, second].filter(
    (value): value is string => Boolean(value)
  );

  const unique = parts.filter(
    (value, index) =>
      parts.findIndex(
        (other) => other.toLowerCase() === value.toLowerCase()
      ) === index
  );

  if (
    variant.name &&
    variant.option_1_value &&
    variant.name.trim().toLowerCase() ===
      variant.option_1_value.trim().toLowerCase()
  ) {
    return [variant.name, second].filter(Boolean).join(" · ");
  }

  return unique.join(" · ");
}

export default function AddToCartButton({
  product,
  variants = [],
  configuration = null,
}: {
  product: Product;
  variants?: ProductVariantForCart[];
  configuration?: ProductConfiguration | null;
}) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  const normalizedConfiguration = useMemo(
    () => normalizeConfiguration(configuration),
    [configuration]
  );

  const hasConfiguration =
    Boolean(normalizedConfiguration?.is_active) &&
    Boolean(normalizedConfiguration?.pricing_rules.length);

  const activeVariants = useMemo(
    () =>
      hasConfiguration
        ? []
        : variants
            .filter((variant) => variant.is_active !== false)
            .sort((a, b) => Number(b.stock ?? 0) - Number(a.stock ?? 0)),
    [hasConfiguration, variants]
  );

  const firstAvailableVariant =
    activeVariants.find((variant) => Number(variant.stock ?? 0) > 0) ??
    activeVariants[0] ??
    null;

  const [selectedVariantId, setSelectedVariantId] = useState(
    firstAvailableVariant?.id ?? ""
  );

  const selectedVariant =
    activeVariants.find((variant) => variant.id === selectedVariantId) ??
    firstAvailableVariant;

  const initialSelections = useMemo(
    () =>
      normalizedConfiguration
        ? getDefaultSelections(normalizedConfiguration.selectors)
        : {},
    [normalizedConfiguration]
  );

  const [selectedOptions, setSelectedOptions] =
    useState<Record<string, string>>(initialSelections);

  const [configurationQuantity, setConfigurationQuantity] = useState(
    normalizedConfiguration?.quantity_config?.base ??
      normalizedConfiguration?.quantity_config?.min ??
      1
  );

  const selectedRule =
    normalizedConfiguration && hasConfiguration
      ? getRule(normalizedConfiguration, selectedOptions)
      : null;

  const configurationKey =
    normalizedConfiguration && hasConfiguration
      ? buildRuleKey(normalizedConfiguration.selectors, selectedOptions)
      : null;

  const hasVariants = activeVariants.length > 0;

  const price = hasConfiguration
    ? selectedRule && normalizedConfiguration
      ? calculateConfiguredPrice(
          selectedRule,
          normalizedConfiguration.quantity_config,
          configurationQuantity
        )
      : 0
    : Number(
        selectedVariant ? selectedVariant.price_cop ?? 0 : product.price ?? 0
      );

  const stock = Math.max(
    Number(
      selectedVariant ? selectedVariant.stock ?? 0 : product.stock ?? 0
    ),
    0
  );

  const cartId = hasConfiguration
    ? `${product.id}:config:${configurationKey ?? "none"}:${configurationQuantity}`
    : selectedVariant
    ? `${product.id}:${selectedVariant.id}`
    : product.id;

  const currentItem = items.find((item) => item.id === cartId);
  const currentQuantity = Number(currentItem?.quantity ?? 0);

  const isAvailable =
    stock > 0 &&
    price > 0 &&
    (!hasVariants || !!selectedVariant) &&
    (!hasConfiguration || !!selectedRule);

  const reachedStockLimit = isAvailable && currentQuantity >= stock;

  function handleAdd() {
    if (!isAvailable || reachedStockLimit) return;

    const configuredOptions =
      hasConfiguration && normalizedConfiguration
        ? buildSelectedOptions(
            normalizedConfiguration,
            selectedOptions,
            configurationQuantity
          )
        : null;

    addItem({
      id: cartId,
      product_id: product.id,
      variant_id: selectedVariant?.id ?? null,
      name: product.name,
      slug: product.slug,
      price,
      image_url: product.image_url,
      stock,
      variant_name: selectedVariant?.name ?? null,
      variant_option_label: selectedVariant?.option_1_label ?? null,
      variant_option_value: selectedVariant?.option_1_value ?? null,
      variant_sku: selectedVariant?.sku ?? null,
      product_category: product.product_category ?? null,
      product_subcategory: product.product_subcategory ?? null,
      configuration_key: hasConfiguration ? configurationKey : null,
      configuration_quantity: hasConfiguration
        ? configurationQuantity
        : null,
      selected_options: configuredOptions,
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2200);
  }

  const buttonLabel = !isAvailable
    ? hasConfiguration
      ? "Configuración no disponible"
      : hasVariants
      ? "Opción no disponible"
      : "Producto agotado"
    : reachedStockLimit
    ? "Máximo disponible en carrito"
    : "Agregar al carrito";

  return (
    <div className="mt-8 w-full">
      {hasConfiguration && normalizedConfiguration && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-black p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-white/35">
            Configura tu producto
          </p>

          <div className="mt-4 grid gap-4">
            {normalizedConfiguration.selectors.map((selector) => (
              <label key={selector.id} className="block">
                <span className="mb-2 block text-xs text-white/45">
                  {selector.label}
                </span>

                <select
                  value={selectedOptions[selector.id] ?? ""}
                  onChange={(event) =>
                    setSelectedOptions((current) => ({
                      ...current,
                      [selector.id]: event.target.value,
                    }))
                  }
                  className="min-h-12 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-white/35"
                >
                  {selector.values.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            {normalizedConfiguration.quantity_config && (
              <label className="block">
                <span className="mb-2 block text-xs text-white/45">
                  {normalizedConfiguration.quantity_config.label}
                </span>

                <QuantitySelector
                  min={normalizedConfiguration.quantity_config.min}
                  max={normalizedConfiguration.quantity_config.max}
                  step={normalizedConfiguration.quantity_config.step}
                  value={configurationQuantity}
                  onChange={setConfigurationQuantity}
                />
              </label>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/30">
              Precio de esta configuración
            </p>

            <p className="mt-2 text-2xl font-semibold">
              {formatCOP(price)}
            </p>
          </div>
        </div>
      )}

      {hasVariants && (
        <div className="mb-5 rounded-2xl border border-white/10 bg-black p-4">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.25em] text-white/35">
              Selecciona una opción
            </span>

            <select
              value={selectedVariant?.id ?? ""}
              onChange={(event) => setSelectedVariantId(event.target.value)}
              className="min-h-12 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-white/35"
            >
              {activeVariants.map((variant) => {
                const variantStock = Number(variant.stock ?? 0);
                const variantPrice = Number(variant.price_cop ?? 0);

                const label = `${getVariantLabel(
                  variant
                )} · ${formatCOP(variantPrice)}${
                  variantStock <= 0 ? " · agotado" : ""
                }`;

                return (
                  <option
                    key={variant.id}
                    value={variant.id}
                    disabled={variantStock <= 0 || variantPrice <= 0}
                  >
                    {label}
                  </option>
                );
              })}
            </select>
          </label>

          {selectedVariant && (
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-white/30">
                  Precio
                </p>

                <p className="mt-1 font-semibold">
                  {formatCOP(price)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-white/30">
                  Disponibles
                </p>

                <p className="mt-1 font-semibold">{stock}</p>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={!isAvailable || reachedStockLimit}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-medium text-black transition hover:scale-[1.02] hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
      >
        {buttonLabel}
      </button>

      {isAvailable && stock <= 5 && (
        <p className="mt-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-3 text-sm text-yellow-200/85">
          Pocas unidades disponibles: {stock}.
        </p>
      )}

      {reachedStockLimit && (
        <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/45">
          Ya agregaste todas las unidades disponibles de esta opción.
        </p>
      )}

      {added && (
        <div className="mt-3 rounded-2xl border border-green-400/20 bg-green-400/10 p-3 text-sm text-green-300">
          Producto agregado al carrito.

          <Link
            href="/carrito"
            className="ml-2 font-medium underline underline-offset-4"
          >
            Ver carrito
          </Link>
        </div>
      )}
    </div>
  );
}

function QuantitySelector({
  min,
  max,
  step,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const values: number[] = [];

  for (let current = min; current <= max; current += step) {
    values.push(current);

    if (values.length > 100) {
      break;
    }
  }

  if (values.length <= 60) {
    return (
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="min-h-12 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-white/35"
      >
        {values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      className="min-h-12 w-full rounded-xl border border-white/10 bg-neutral-950 px-4 py-3 text-sm text-white outline-none focus:border-white/35"
    />
  );
}
