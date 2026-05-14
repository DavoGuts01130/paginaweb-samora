"use client";

import { useEffect, useState } from "react";

interface LightboxProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function Lightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: LightboxProps) {
  const [showUI, setShowUI] = useState(true);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const handleMove = () => {
      setShowUI(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setShowUI(false);
      }, 2500);
    };

    handleMove();
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchstart", handleMove);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchstart", handleMove);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const scrollBarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollBarWidth}px`;

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  if (!images[currentIndex]) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <img
        src={images[currentIndex]}
        alt={`preview ${currentIndex + 1}`}
        className="max-h-[82vh] max-w-full rounded-2xl object-contain shadow-2xl sm:max-h-[88vh] sm:max-w-[92vw]"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className={`absolute bottom-6 left-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-2xl text-white/80 backdrop-blur-md transition duration-300 hover:bg-white/15 hover:text-white sm:bottom-auto sm:left-6 sm:top-1/2 sm:h-12 sm:w-12 sm:-translate-y-1/2 ${
              showUI ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-label="Imagen anterior"
          >
            ←
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className={`absolute bottom-6 right-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-2xl text-white/80 backdrop-blur-md transition duration-300 hover:bg-white/15 hover:text-white sm:bottom-auto sm:right-6 sm:top-1/2 sm:h-12 sm:w-12 sm:-translate-y-1/2 ${
              showUI ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
            aria-label="Imagen siguiente"
          >
            →
          </button>
        </>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={`absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-2xl text-white/80 backdrop-blur-md transition duration-300 hover:bg-white/15 hover:text-white sm:right-6 sm:top-6 sm:h-12 sm:w-12 ${
          showUI ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-label="Cerrar vista previa"
      >
        ×
      </button>

      <div
        className={`absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs tracking-[0.3em] text-white/70 backdrop-blur-md transition duration-300 sm:bottom-6 sm:tracking-[0.4em] ${
          showUI ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {String(currentIndex + 1).padStart(2, "0")} —{" "}
        {String(images.length).padStart(2, "0")}
      </div>
    </div>
  );
}