import type { AppProps } from "next/app";

/**
 * Necesario junto a `_error.tsx` para que el Pages Router registre bien las
 * rutas de error internas de Next y no aparezca "missing required error components".
 */
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
