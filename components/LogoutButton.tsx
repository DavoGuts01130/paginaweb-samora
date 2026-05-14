"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex min-h-12 w-full items-center justify-center rounded-full border border-red-400/30 px-6 py-3 text-sm font-medium text-red-400 transition hover:bg-red-400 hover:text-black sm:w-auto"
    >
      Cerrar sesión
    </button>
  );
}