"use client";

/**
 * Sustituye al layout raíz cuando falla el propio layout.
 * Debe incluir <html> y <body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "1rem",
            background: "#f1f5f9",
            color: "#0f172a",
          }}
        >
          <h1 style={{ fontSize: "1.25rem" }}>Error crítico</h1>
          <p style={{ fontSize: "0.875rem", color: "#475569", textAlign: "center", maxWidth: "28rem" }}>
            {error.message || "No se ha podido cargar la aplicación."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#2563eb",
              color: "#fff",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
