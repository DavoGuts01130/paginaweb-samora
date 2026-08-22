"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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

    let mounted = true;

    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (mounted) {
        setIsLoggedIn(!!user);
      }
    }

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsLoggedIn(!!session?.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 text-white sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Ir al inicio de Samora Estudio"
          className="group flex min-w-0 items-center gap-3 text-white"
        >
          <span className="shrink-0 text-lg font-semibold uppercase tracking-[0.24em] transition group-hover:tracking-[0.28em] sm:text-xl">
            Samora
          </span>

          <span className="hidden h-7 w-px shrink-0 bg-white/15 sm:block" />

          <Image
            src="/brand/samora-submarca-navbar.png"
            alt="Samora Estudio Creativo"
            width={44}
            height={54}
            priority
            className="hidden h-9 w-auto shrink-0 object-contain opacity-85 transition group-hover:opacity-100 sm:block xl:h-10"
          />
        </Link>

        <div className="hidden items-center gap-6 xl:flex">
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

        <div className="hidden items-center gap-3 xl:flex">
          <CartNavLink />
          <AccountLink isLoggedIn={isLoggedIn} />
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <CartNavLink />

          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-white/35 hover:bg-white hover:text-black"
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
        <div className="fixed inset-x-0 top-[68px] z-40 h-[calc(100vh-68px)] overflow-y-auto border-t border-white/10 bg-black/95 px-4 py-5 backdrop-blur-xl xl:hidden">
          <div className="mx-auto max-w-7xl">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
              <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
                <span className="text-base font-semibold uppercase tracking-[0.24em] text-white">
                  Samora
                </span>

                <span className="h-7 w-px bg-white/15" />

                <Image
                  src="/brand/samora-submarca-navbar.png"
                  alt="Samora Estudio Creativo"
                  width={44}
                  height={54}
                  className="h-9 w-auto object-contain opacity-85"
                />
              </div>

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