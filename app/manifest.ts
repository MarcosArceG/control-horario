import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Control Horario",
    short_name: "Fichaje",
    description:
      "Registro de entradas y salidas con correcciones y auditoría.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f4f7fc",
    theme_color: "#2563eb",
    lang: "es",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
        purpose: "any",
      },
    ],
  };
}
