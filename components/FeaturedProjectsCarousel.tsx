"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type FeaturedProject = {
  id: string;
  title: string;
  slug: string;
  cover_image: string;
  categoryName: string;
  categorySlug: string;
  client?: string | null;
  year?: string | number | null;
};

export default function FeaturedProjectsCarousel({
  projects,
}: {
  projects: FeaturedProject[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (projects.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % projects.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [projects.length]);

  if (!projects.length) return null;

  const activeProject = projects[activeIndex];

  return (
    <div className="mt-14 overflow-hidden rounded-[2rem] border border-white/10 bg-neutral-950">
      <div className="relative h-[46vh] min-h-[380px] overflow-hidden md:h-[62vh]">
        {projects.map((project, index) => (
          <Image
            key={project.id}
            src={project.cover_image}
            alt={project.title}
            fill
            priority={index === 0}
            className={`object-cover transition duration-1000 ${
              index === activeIndex
                ? "scale-100 opacity-85"
                : "scale-105 opacity-0"
            }`}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-transparent to-black/30" />

        <div className="absolute bottom-0 left-0 max-w-2xl p-8 md:p-10">
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">
            Proyecto destacado
          </p>

          <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
            {activeProject.title}
          </h2>

          {(activeProject.client || activeProject.year) && (
            <p className="mt-3 text-sm text-white/45">
              {[activeProject.client, activeProject.year]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 md:text-base">
            Cada proyecto se trabaja como una pieza visual propia: composición,
            luz, edición y entrega pensadas para transmitir una experiencia
            completa.
          </p>

          <Link
            href={`/portafolio/${activeProject.categorySlug}/${activeProject.slug}`}
            className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:scale-[1.02]"
          >
            Ver proyecto destacado
          </Link>
        </div>

        {projects.length > 1 && (
          <div className="absolute bottom-8 right-8 flex items-center gap-2">
            {projects.map((project, index) => (
              <button
                key={project.id}
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver destacado ${index + 1}`}
                className={`h-2 rounded-full transition ${
                  index === activeIndex
                    ? "w-8 bg-white"
                    : "w-2 bg-white/35 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}