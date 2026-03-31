import type { MetadataRoute } from "next";

/**
 * PWA: Android (Chrome), escritorio (Chrome/Edge) e iOS 16.4+ leen el manifest.
 * iOS también usa `metadata` en layout (apple-touch-icon, apple-mobile-web-app-*).
 *
 * En producción, define NEXT_PUBLIC_APP_URL (p. ej. https://tu-dominio.com)
 * para un `id` estable del instalador en Chrome.
 */
export default function manifest(): MetadataRoute.Manifest {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

  return {
    ...(appUrl ? { id: `${appUrl}/` } : {}),
    name: "Triclock",
    short_name: "Triclock",
    description:
      "Triclock: control horario con correcciones y registro de actividad.",
    start_url: "/",
    scope: "/",
    lang: "es",
    dir: "ltr",
    display: "standalone",
    display_override: ["standalone", "minimal-ui", "browser"],
    orientation: "portrait-primary",
    background_color: "#f4f7fc",
    theme_color: "#2563eb",
    categories: ["productivity", "business"],
    prefer_related_applications: false,
    launch_handler: {
      client_mode: "navigate-existing",
    },
    icons: [
      {
        src: "/icono.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icono.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icono.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icono.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
