/**
 * Fallback del Pages Router que Next sigue buscando al renderizar errores 500
 * en ciertos caminos internos. Sin este archivo, en dev puede aparecer:
 * "missing required error components, refreshing..."
 */
import type { NextPageContext } from "next";

type Props = { statusCode?: number };

export default function LegacyErrorPage({ statusCode }: Props) {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
        {statusCode ? `Error ${statusCode}` : "Error de aplicación"}
      </h1>
      <p style={{ color: "#64748b", fontSize: "0.875rem" }}>
        Vuelve a intentarlo o recarga la página.
      </p>
    </div>
  );
}

LegacyErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res
    ? res.statusCode
    : err
      ? (err as { statusCode?: number }).statusCode ?? 500
      : 404;
  return { statusCode };
};
