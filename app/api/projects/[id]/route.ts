import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  // 🔐 Verificar usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no autenticado" },
      { status: 401 }
    );
  }

  // 🔐 Verificar rol admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json(
      { error: "No tienes permisos para eliminar proyectos" },
      { status: 403 }
    );
  }

  // 📸 1. Obtener imágenes del proyecto
  const { data: images, error: imagesError } = await supabase
    .from("portfolio_images")
    .select("image_url")
    .eq("project_id", id);

  if (imagesError) {
    return NextResponse.json(
      { error: imagesError.message },
      { status: 500 }
    );
  }

  // 🗑️ 2. Eliminar imágenes del storage
  if (images && images.length > 0) {
    const paths = images
      .map((img) =>
        img.image_url.split("/storage/v1/object/public/portfolio/")[1]
      )
      .filter(Boolean);

    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from("portfolio")
        .remove(paths);

      if (storageError) {
        return NextResponse.json(
          { error: storageError.message },
          { status: 500 }
        );
      }
    }
  }

  // 🧹 3. Eliminar registros de imágenes
  const { error: imagesDeleteError } = await supabase
    .from("portfolio_images")
    .delete()
    .eq("project_id", id);

  if (imagesDeleteError) {
    return NextResponse.json(
      { error: imagesDeleteError.message },
      { status: 500 }
    );
  }

  // 🗑️ 4. Eliminar proyecto
  const { error: projectDeleteError } = await supabase
    .from("portfolio_projects")
    .delete()
    .eq("id", id);

  if (projectDeleteError) {
    return NextResponse.json(
      { error: projectDeleteError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}