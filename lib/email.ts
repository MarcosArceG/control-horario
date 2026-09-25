import { parseSuperadminAccountsFromEnv } from "@/lib/superadmin-env";

/**
 * Envío de correo transaccional vía API REST de Brevo (sin SDK).
 *
 * Variables:
 *   BREVO_API_KEY       clave API de Brevo (obligatoria para enviar)
 *   BREVO_SENDER_EMAIL  remitente verificado en Brevo (obligatorio)
 *   BREVO_SENDER_NAME   nombre del remitente (opcional, por defecto "TriClock")
 *   ADMIN_NOTIFY_EMAILS destinatarios de avisos, separados por coma (opcional;
 *                       si no se define, se usan los superadmins de AUTH_USER_N_EMAIL)
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function adminNotifyEmails(): string[] {
  const raw = process.env.ADMIN_NOTIFY_EMAILS;
  if (raw?.trim()) {
    return [
      ...new Set(
        raw
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];
  }
  return parseSuperadminAccountsFromEnv().map((a) => a.email);
}

export async function sendEmail(params: {
  to: string[];
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim();
  if (!apiKey || !senderEmail) {
    console.warn("[email] BREVO_API_KEY o BREVO_SENDER_EMAIL sin configurar; no se envía.");
    return;
  }
  if (params.to.length === 0) {
    console.warn("[email] Sin destinatarios; no se envía.");
    return;
  }

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: process.env.BREVO_SENDER_NAME?.trim() || "TriClock",
      },
      to: params.to.map((email) => ({ email })),
      subject: params.subject,
      htmlContent: params.html,
      textContent: params.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status}: ${body.slice(0, 500)}`);
  }
}
