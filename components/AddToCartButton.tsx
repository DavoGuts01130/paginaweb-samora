"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";

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

  return [variant.name, first, second].filter(Boolean).join(" · ");
}

export default function AddToCartButton({
  product,
  variants = [],
}: {
  product: Product;
  variants?: ProductVariantForCart[];
}) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  const activeVariants = useMemo(
    () =>
      variants
        .filter((variant) => variant.is_active !== false)
        .sort((a, b) => Number(b.stock ?? 0) - Number(a.stock ?? 0)),
    [variants]
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

  const hasVariants = activeVariants.length > 0;
  const cartId = selectedVariant ? `${product.id}:${selectedVariant.id}` : product.id;
  const currentItem = items.find((item) => item.id === cartId);
  const currentQuantity = Number(currentItem?.quantity ?? 0);
  const stock = Math.max(
    Number(selectedVariant ? selectedVariant.stock ?? 0 : product.stock ?? 0),
    0
  );
  const price = Number(selectedVariant ? selectedVariant.price_cop ?? 0 : product.price ?? 0);
  const isAvailable = stock > 0 && price > 0 && (!hasVariants || !!selectedVariant);
  const reachedStockLimit = isAvailable && currentQuantity >= stock;

  function handleAdd() {
    if (!isAvailable || reachedStockLimit) return;

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
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2200);
  }

  const buttonLabel = !isAvailable
    ? hasVariants
      ? "Opción no disponible"
      : "Producto agotado"
    : reachedStockLimit
    ? "Máximo disponible en carrito"
    : "Agregar al carrito";

  return (
    <div className="mt-8 w-full">
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
                const label = `${getVariantLabel(variant)} · ${formatCOP(variantPrice)}${
                  variantStock <= 0 ? " · agotado" : ""
                }`;

                return (
                  <option key={variant.id} value={variant.id} disabled={variantStock <= 0 || variantPrice <= 0}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>

          {selectedVariant && (
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-white/30">Precio</p>
                <p className="mt-1 font-semibold">{formatCOP(price)}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-white/30">Disponibles</p>
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
          <Link href="/carrito" className="ml-2 font-medium underline underline-offset-4">
            Ver carrito
          </Link>
        </div>
      )}
    </div>
  );
}
