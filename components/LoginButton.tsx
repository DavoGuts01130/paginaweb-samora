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
      onClick={handleLogin}
      className="rounded-full border border-white px-6 py-3 text-sm transition hover:bg-white hover:text-black"
    >
      Continuar con Google
    </button>
  );
}