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
  stock?: number;
};

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const stock = Number(product.stock ?? 0);
  const isAvailable = stock > 0;

  function handleAdd() {
    if (!isAvailable) return;

    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image_url: product.image_url,
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2200);
  }

  return (
    <div className="mt-8 w-full">
      <button
        type="button"
        onClick={handleAdd}
        disabled={!isAvailable}
        className="flex min-h-12 w-full items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-medium text-black transition hover:scale-[1.02] hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
      >
        {isAvailable ? "Agregar al carrito" : "Producto agotado"}
      </button>

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
