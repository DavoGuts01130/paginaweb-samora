"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartNavLink() {
  const { totalItems } = useCart();

  return (
    <Link
      href="/carrito"
      aria-label="Abrir carrito"
      title="Carrito"
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-white/35 hover:bg-white hover:text-black"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6.5 7.5h11l-1 9h-9z" />
        <path d="M9 7.5a3 3 0 0 1 6 0" />
        <path d="M9 19.5h.01" />
        <path d="M15 19.5h.01" />
      </svg>

      {totalItems > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold leading-none text-black">
          {totalItems > 99 ? "99+" : totalItems}
        </span>
      )}
    </Link>
  );
}