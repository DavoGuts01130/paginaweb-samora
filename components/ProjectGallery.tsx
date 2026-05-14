"use client";

import { useState } from "react";
import Lightbox from "@/components/Lightbox";

type GalleryImage = {
  src: string;
  alt: string;
  height: string;
};

interface ProjectGalleryProps {
  images: GalleryImage[];
}

export default function ProjectGallery({ images }: ProjectGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:block lg:columns-3 lg:gap-6 lg:space-y-6">
        {images.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className="group block w-full break-inside-avoid overflow-hidden rounded-[1.5rem] border border-white/5 bg-neutral-950 text-left lg:mb-6"
          >
            <img
              src={image.src}
              alt={image.alt}
              className={`w-full object-cover transition duration-500 group-hover:scale-[1.03] ${image.height}`}
            />
          </button>
        ))}
      </div>

      {selectedIndex !== null && (
        <Lightbox
          images={images.map((img) => img.src)}
          currentIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
          onNext={() =>
            setSelectedIndex((prev) =>
              prev !== null ? (prev + 1) % images.length : prev
            )
          }
          onPrev={() =>
            setSelectedIndex((prev) =>
              prev !== null ? (prev - 1 + images.length) % images.length : prev
            )
          }
        />
      )}
    </>
  );
}