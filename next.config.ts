import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // La imagen de vista previa de cada negocio lee su logo de public/ con readFile.
  outputFileTracingIncludes: {
    "/[slug]/opengraph-image": ["./public/negocios/**/*.svg"],
  },
  // El link de gestión de una reserva es una llave: no debe filtrarse en el referrer a otros sitios.
  async headers() {
    return [
      {
        source: "/reserva/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
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

export default nextConfig;
