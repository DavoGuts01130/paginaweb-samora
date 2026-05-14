"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { createClient } from "@/lib/supabase/client";
import ImageAdjustControls from "@/components/ImageAdjustControls";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type ProjectImage = {
  id: string;
  image_url: string;
  position: number | null;
  image_fit?: string | null;
  image_zoom?: number | null;
  image_x?: number | null;
  image_y?: number | null;
};

type Props = {
  images: ProjectImage[];
};

function getObjectFit(value?: string | null): CSSProperties["objectFit"] {
  return value === "contain" ? "contain" : "cover";
}

function SortableImage({
  image,
  onDelete,
  onEdit,
}: {
  image: ProjectImage;
  onDelete: (image: ProjectImage) => void;
  onEdit: (image: ProjectImage) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const dragStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform) ?? undefined,
    transition,
  };

  const imageFit = getObjectFit(image.image_fit);
  const imageZoom = Number(image.image_zoom ?? 1);
  const imageX = Number(image.image_x ?? 50);
  const imageY = Number(image.image_y ?? 50);

  const imageStyle: CSSProperties = {
    objectFit: imageFit,
    objectPosition: `${imageX}% ${imageY}%`,
    transform: `scale(${imageZoom})`,
  };

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-black ${
        isDragging ? "z-20 scale-105 opacity-80" : ""
      }`}
    >
      <img
        src={image.image_url}
        alt="Imagen del proyecto"
        className="h-24 w-full"
        style={imageStyle}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 opacity-0 transition hover:opacity-100">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-full border border-white/20 px-3 py-1 text-xs text-white active:cursor-grabbing"
        >
          Arrastrar
        </button>

        <button
          type="button"
          onClick={() => onEdit(image)}
          className="rounded-full border border-white/20 px-3 py-1 text-xs text-white transition hover:bg-white hover:text-black"
        >
          Ajustar
        </button>

        <button
          type="button"
          onClick={() => onDelete(image)}
          className="text-xs text-red-300 transition hover:text-red-200"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

export default function ProjectImagesManager({ images }: Props) {
  const supabase = createClient();

  const [localImages, setLocalImages] = useState<ProjectImage[]>(
    [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  );

  const [editingImage, setEditingImage] = useState<ProjectImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingAdjust, setSavingAdjust] = useState(false);

  const [imageFit, setImageFit] = useState("cover");
  const [imageZoom, setImageZoom] = useState(1);
  const [imageX, setImageX] = useState(50);
  const [imageY, setImageY] = useState(50);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  function getStoragePath(publicUrl: string) {
    const marker = "/storage/v1/object/public/portfolio/";
    return publicUrl.split(marker)[1];
  }

  function openEditor(image: ProjectImage) {
    setEditingImage(image);
    setImageFit(image.image_fit ?? "cover");
    setImageZoom(Number(image.image_zoom ?? 1));
    setImageX(Number(image.image_x ?? 50));
    setImageY(Number(image.image_y ?? 50));
  }

  async function saveImageAdjustments() {
    if (!editingImage) return;

    setSavingAdjust(true);

    const { error } = await supabase
      .from("portfolio_images")
      .update({
        image_fit: imageFit,
        image_zoom: imageZoom,
        image_x: imageX,
        image_y: imageY,
      })
      .eq("id", editingImage.id);

    if (error) {
      alert(`Error guardando ajuste: ${error.message}`);
      setSavingAdjust(false);
      return;
    }

    setLocalImages((current) =>
      current.map((img) =>
        img.id === editingImage.id
          ? {
              ...img,
              image_fit: imageFit,
              image_zoom: imageZoom,
              image_x: imageX,
              image_y: imageY,
            }
          : img
      )
    );

    setEditingImage(null);
    setSavingAdjust(false);
  }

  async function handleDelete(image: ProjectImage) {
    const confirmed = confirm("¿Eliminar esta imagen?");
    if (!confirmed) return;

    const path = getStoragePath(image.image_url);

    if (path) {
      await supabase.storage.from("portfolio").remove([path]);
    }

    const { error } = await supabase
      .from("portfolio_images")
      .delete()
      .eq("id", image.id);

    if (error) {
      alert(`Error eliminando imagen: ${error.message}`);
      return;
    }

    setLocalImages((prev) => prev.filter((img) => img.id !== image.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setLocalImages((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      return arrayMove(items, oldIndex, newIndex);
    });
  }

  async function saveOrder() {
    setLoading(true);

    for (const [index, image] of localImages.entries()) {
      const { error } = await supabase
        .from("portfolio_images")
        .update({ position: index })
        .eq("id", image.id);

      if (error) {
        alert(`Error guardando orden: ${error.message}`);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    alert("Orden actualizado.");
    window.location.reload();
  }

  if (localImages.length === 0) {
    return <p className="mt-4 text-sm text-white/40">Sin imágenes.</p>;
  }

  return (
    <div className="mt-4">
      <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/35">
        Orden de galería
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localImages.map((image) => image.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-3 gap-3">
            {localImages.map((image) => (
              <SortableImage
                key={image.id}
                image={image}
                onDelete={handleDelete}
                onEdit={openEditor}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={saveOrder}
        disabled={loading}
        className="mt-4 w-full rounded-full bg-white px-6 py-2 text-sm font-medium text-black transition hover:scale-[1.02] disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar orden"}
      </button>

      {editingImage && (
        <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-neutral-950 p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/35">
                Ajuste de imagen
              </p>
              <h3 className="mt-1 text-xl font-semibold">
                Imagen de galería
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setEditingImage(null)}
              className="text-sm text-white/45 transition hover:text-white"
            >
              Cerrar
            </button>
          </div>

          <ImageAdjustControls
            imageUrl={editingImage.image_url}
            imageFit={imageFit}
            imageZoom={imageZoom}
            imageX={imageX}
            imageY={imageY}
            onImageFitChange={setImageFit}
            onImageZoomChange={setImageZoom}
            onImageXChange={setImageX}
            onImageYChange={setImageY}
          />

          <button
            type="button"
            onClick={saveImageAdjustments}
            disabled={savingAdjust}
            className="mt-4 w-full rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02] disabled:opacity-50"
          >
            {savingAdjust ? "Guardando ajuste..." : "Guardar ajuste visual"}
          </button>
        </div>
      )}
    </div>
  );
}