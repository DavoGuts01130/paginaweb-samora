import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code")?.trim() ?? "";

  if (!code) {
    return NextResponse.json(
      { error: "Ingresa un código de seguimiento." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_tracking_by_code", {
    input_code: code,
  });

  if (error) {
    return NextResponse.json(
      { error: "No se pudo consultar el seguimiento." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "No encontramos un pedido o servicio con ese código." },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
