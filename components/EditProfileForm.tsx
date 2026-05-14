"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string;
  phone: string;
  department: string;
  city: string;
  address: string;
  reference: string;
};

export default function EditProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState(profile);
  const [loading, setLoading] = useState(false);

  function updateField(field: keyof Profile, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Debes iniciar sesión para actualizar tus datos.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        phone: form.phone,
        department: form.department,
        city: form.city,
        address: form.address,
        reference: form.reference,
      })
      .eq("id", user.id);

    if (error) {
      alert(`Error actualizando perfil: ${error.message}`);
      setLoading(false);
      return;
    }

    router.push("/mi-cuenta");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[1.5rem] border border-white/10 bg-neutral-950 p-6"
    >
      <div className="space-y-4">
        <Input
          label="Nombre completo"
          value={form.full_name}
          onChange={(value) => updateField("full_name", value)}
          placeholder="Tu nombre completo"
        />

        <Input
          label="Teléfono"
          value={form.phone}
          onChange={(value) => updateField("phone", value)}
          placeholder="Ej: 3192709536"
        />

        <Input
          label="Departamento"
          value={form.department}
          onChange={(value) => updateField("department", value)}
          placeholder="Ej: Cundinamarca"
        />

        <Input
          label="Ciudad / Municipio"
          value={form.city}
          onChange={(value) => updateField("city", value)}
          placeholder="Ej: Bogotá"
        />

        <Input
          label="Dirección"
          value={form.address}
          onChange={(value) => updateField("address", value)}
          placeholder="Ej: Carrera 6 #2-46"
        />

        <Input
          label="Referencia"
          value={form.reference}
          onChange={(value) => updateField("reference", value)}
          placeholder="Ej: Casa de tres pisos, frente al parque"
        />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-white px-8 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/mi-cuenta")}
          className="rounded-full border border-white/20 px-8 py-3 text-sm text-white/70 transition hover:bg-white hover:text-black"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Input({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-white/45">{label}</span>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/40"
      />
    </label>
  );
}