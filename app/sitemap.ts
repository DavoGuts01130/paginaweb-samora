import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://samora.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const staticRoutes = [
    "",
    "/portafolio",
    "/servicios",
    "/tienda",
    "/nosotros",
    "/contacto",
    "/seguimiento",
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  const { data: projects } = await supabase
    .from("portfolio_projects")
    .select(`
      slug,
      updated_at,
      created_at,
      portfolio_categories (
        slug
      )
    `);

  const projectRoutes =
    projects?.map((project) => {
      const category = Array.isArray(project.portfolio_categories)
        ? project.portfolio_categories[0]
        : project.portfolio_categories;

      return {
        url: `${siteUrl}/portafolio/${category?.slug}/${project.slug}`,
        lastModified: new Date(project.updated_at ?? project.created_at ?? Date.now()),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      };
    }) ?? [];

  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at, created_at")
    .eq("is_active", true);

  const productRoutes =
    products?.map((product) => ({
      url: `${siteUrl}/tienda/${product.slug}`,
      lastModified: new Date(product.updated_at ?? product.created_at ?? Date.now()),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })) ?? [];

  return [...staticRoutes, ...projectRoutes, ...productRoutes];
}