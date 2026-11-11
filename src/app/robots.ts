import type { MetadataRoute } from "next";
import { urlSitio } from "@/lib/sitio";

// Las páginas privadas (paneles, login, links de gestión de turnos) quedan fuera de los buscadores.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/panel", "/operador", "/login", "/auth", "/cambiar-contrasena", "/reserva/", "/estado", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", urlSitio()).href,
  };
}
