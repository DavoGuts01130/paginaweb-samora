import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Imágenes de Unsplash
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },

      // Imágenes almacenadas en Supabase Storage
      {
        protocol: "https",
        hostname: "zmhkvevkrzpdzgegruajh.supabase.co",
      },
    ],
  },
};

export default nextConfig;
