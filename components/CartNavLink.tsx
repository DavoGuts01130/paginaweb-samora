"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartNavLink() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/carrito"
      className="relative inline-flex min-h-10 items-center justify-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-black"
    >
      Carrito

      {totalItems > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold leading-none text-black sm:h-5 sm:min-w-5 sm:text-xs">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}