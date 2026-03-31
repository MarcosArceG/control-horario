import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /*
   * Imprescindible si existe otro package-lock.json por encima (p. ej. el repo
   * git en `~/`). Sin esto Next infiere mal la raíz del workspace y fallan
   * rutas, CSS y el fallback `/_error` → "missing required error components".
   */
  outputFileTracingRoot: path.join(__dirname),
  /** Los navegadores piden /favicon.ico por defecto; servimos el mismo PNG que PWA. */
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icono.png" }];
  },
};

export default nextConfig;
