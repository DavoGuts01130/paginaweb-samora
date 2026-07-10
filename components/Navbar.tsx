"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CartNavLink from "@/components/CartNavLink";
import { createClient } from "@/lib/supabase/client";

const links = [
  { name: "Inicio", href: "/" },
  { name: "Portafolio", href: "/portafolio" },
  { name: "Servicios", href: "/servicios" },
  { name: "Tienda", href: "/tienda" },
  { name: "Seguimiento", href: "/seguimiento" },
  { name: "Nosotros", href: "/nosotros" },
  { name: "Contacto", href: "/contacto" },
];

export default function Navbar() {
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(!!user);
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function isActiveLink(href: string) {
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  }

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/75 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 text-white sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold uppercase tracking-[0.22em] transition hover:tracking-[0.26em] sm:text-xl"
        >
          Samora
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => {
            const active = isActiveLink(link.href);

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm transition ${
                  active ? "text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <CartNavLink />

          <AccountLink isLoggedIn={isLoggedIn} />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <CartNavLink />

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition hover:bg-white hover:text-black"
          >
            {menuOpen ? (
              <span className="text-2xl leading-none">×</span>
            ) : (
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-x-0 top-[73px] z-40 h-[calc(100vh-73px)] overflow-y-auto border-t border-white/10 bg-black/95 px-4 py-5 backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="grid gap-2">
                {links.map((link) => {
                  const active = isActiveLink(link.href);

                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`rounded-2xl px-4 py-3 text-sm transition ${
                        active
                          ? "bg-white text-black"
                          : "text-white/65 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-white/10 pt-4">
                <Link
                  href={isLoggedIn ? "/mi-cuenta" : "/login"}
                  className="flex min-h-12 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
                >
                  {isLoggedIn ? "Ir a mi cuenta" : "Ingresar"}
                </Link>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-black p-4 text-sm leading-6 text-white/45">
                Explora el portafolio, solicita una cotización, revisa productos
                o consulta el estado de un pedido desde el menú principal.
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function AccountLink({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <Link
      href={isLoggedIn ? "/mi-cuenta" : "/login"}
      aria-label={isLoggedIn ? "Abrir mi cuenta" : "Ingresar"}
      title={isLoggedIn ? "Mi cuenta" : "Ingresar"}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/75 transition hover:border-white/35 hover:bg-white hover:text-black"
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
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    </Link>
  );
}