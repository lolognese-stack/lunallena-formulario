import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Se sirve en lunallenatravel.vercel.app/armador (rewrite en el vercel.json de la web).
  basePath: "/armador",
  // Igual que la web (vercel.json trailingSlash): si no, /armador/ y /armador se redirigen en círculo.
  trailingSlash: true,
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Las fotos del catálogo salen de las fichas de lunallenatravel.com.
    remotePatterns: [{ protocol: "https", hostname: "lunallenatravel.com", pathname: "/wp-content/uploads/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
