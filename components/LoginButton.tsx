"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClient();

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      className="premium-button flex min-h-12 w-full items-center justify-center rounded-full border border-white px-6 py-3 text-sm font-medium transition hover:bg-white hover:text-black sm:w-auto"
    >
      Continuar con Google
    </button>
  );
}