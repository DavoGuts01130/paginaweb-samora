"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  stock?: number | null;
};

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  const stock = Math.max(Number(product.stock ?? 0), 0);
  const currentItem = items.find((item) => item.id === product.id);
  const currentQuantity = Number(currentItem?.quantity ?? 0);
  const isAvailable = stock > 0;
  const reachedStockLimit = isAvailable && currentQuantity >= stock;

  function handleAdd() {
    if (!isAvailable || reachedStockLimit) return;

    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image_url: product.image_url,
      stock,
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2200);
  }

  const buttonLabel = !isAvailable
    ? "Producto agotado"
    : reachedStockLimit
    ? "Máximo disponible en carrito"
    : "Agregar al carrito";

  return (
    <div className="mt-8 w-full">
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
          Ya agregaste todas las unidades disponibles de este producto.
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
