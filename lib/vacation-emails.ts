import { adminNotifyEmails, escapeHtml, sendEmail } from "@/lib/email";

/** Plantillas de correo de vacaciones. Fechas en formato YYYY-MM-DD. */

export type VacationEmailData = {
  employeeEmail: string;
  employeeName: string | null;
  startDate: string;
  endDate: string;
  calendarDays: number;
  note: string | null;
};

function ymdToEs(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function appLink(path: string): string | null {
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || "").replace(/\/$/, "");
  return base ? `${base}${path}` : null;
}

function layout(paragraphs: string[], button?: { href: string | null; label: string }): string {
  const btn = button?.href
    ? `<p><a href="${escapeHtml(button.href)}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:6px">${escapeHtml(button.label)}</a></p>`
    : "";
  return `
<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;line-height:1.5">
  ${paragraphs.map((p) => `<p>${p}</p>`).join("\n  ")}
  ${btn}
</div>`;
}

function rangeText(v: VacationEmailData) {
  const from = ymdToEs(v.startDate);
  const to = ymdToEs(v.endDate);
  const days = plural(v.calendarDays, "día natural", "días naturales");
  return { from, to, days };
}

/** Aviso a los administradores de una nueva solicitud. */
export async function notifyAdminsOfVacationRequest(v: VacationEmailData) {
  const who = v.employeeName?.trim() || v.employeeEmail;
  const { from, to, days } = rangeText(v);
  const link = appLink("/admin/vacaciones");

  const text = [
    `${who} (${v.employeeEmail}) ha solicitado vacaciones.`,
    ``,
    `Del ${from} al ${to} (${days}).`,
    v.note ? `Comentario: ${v.note}` : null,
    ``,
    link
      ? `Revisa y aprueba o rechaza la solicitud en: ${link}`
      : `Revisa la solicitud en el panel de administración.`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const html = layout(
    [
      `<strong>${escapeHtml(who)}</strong> (${escapeHtml(v.employeeEmail)}) ha solicitado vacaciones.`,
      `Del <strong>${from}</strong> al <strong>${to}</strong> (${days}).`,
      ...(v.note ? [`Comentario: <em>${escapeHtml(v.note)}</em>`] : []),
      ...(link ? [] : ["Revisa la solicitud en el panel de administración."]),
    ],
    { href: link, label: "Revisar solicitud" },
  );

  await sendEmail({
    to: adminNotifyEmails(),
    subject: `Solicitud de vacaciones: ${who} (${from} – ${to})`,
    html,
    text,
  });
}

/** Confirmación al empleado de que su solicitud se ha enviado. */
export async function notifyEmployeeVacationRequested(v: VacationEmailData) {
  const { from, to, days } = rangeText(v);
  const link = appLink("/vacaciones");
  const hello = v.employeeName?.trim() ? `Hola ${v.employeeName.trim()},` : "Hola,";

  const text = [
    hello,
    ``,
    `Hemos enviado tu solicitud de vacaciones al administrador.`,
    `Del ${from} al ${to} (${days}).`,
    v.note ? `Comentario: ${v.note}` : null,
    ``,
    `Te avisaremos por correo cuando se revise.`,
    link ? `Puedes consultar su estado en: ${link}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const html = layout(
    [
      escapeHtml(hello),
      `Hemos enviado tu solicitud de vacaciones al administrador.`,
      `Del <strong>${from}</strong> al <strong>${to}</strong> (${days}).`,
      ...(v.note ? [`Comentario: <em>${escapeHtml(v.note)}</em>`] : []),
      `Te avisaremos por correo cuando se revise.`,
    ],
    { href: link, label: "Ver mis vacaciones" },
  );

  await sendEmail({
    to: [v.employeeEmail],
    subject: `Solicitud de vacaciones enviada (${from} – ${to})`,
    html,
    text,
  });
}

/** Aviso al empleado de que su solicitud ha sido aprobada, con los días restantes del año en curso. */
export async function notifyEmployeeVacationApproved(
  v: VacationEmailData,
  balance: { year: number; remaining: number },
) {
  const { from, to, days } = rangeText(v);
  const link = appLink("/vacaciones");
  const hello = v.employeeName?.trim() ? `Hola ${v.employeeName.trim()},` : "Hola,";
  const left = plural(balance.remaining, "día disponible", "días disponibles");
  const verb = balance.remaining === 1 ? "queda" : "quedan";

  const text = [
    hello,
    ``,
    `Tus vacaciones han sido aprobadas.`,
    `Del ${from} al ${to} (${days}).`,
    ``,
    `Te ${verb} ${left} en ${balance.year}.`,
    link ? `\nPuedes consultarlas en: ${link}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const html = layout(
    [
      escapeHtml(hello),
      `Tus vacaciones han sido <strong>aprobadas</strong>.`,
      `Del <strong>${from}</strong> al <strong>${to}</strong> (${days}).`,
      `Te ${verb} <strong>${left}</strong> en ${balance.year}.`,
    ],
    { href: link, label: "Ver mis vacaciones" },
  );

  await sendEmail({
    to: [v.employeeEmail],
    subject: `Vacaciones aprobadas (${from} – ${to})`,
    html,
    text,
  });
}

/** Aviso al empleado de que su solicitud ha sido rechazada. */
export async function notifyEmployeeVacationRejected(v: VacationEmailData) {
  const { from, to, days } = rangeText(v);
  const link = appLink("/vacaciones");
  const hello = v.employeeName?.trim() ? `Hola ${v.employeeName.trim()},` : "Hola,";

  const text = [
    hello,
    ``,
    `Tu solicitud de vacaciones no ha sido aprobada.`,
    `Del ${from} al ${to} (${days}).`,
    ``,
    `Si tienes dudas, habla con el administrador. Puedes enviar una nueva solicitud con otras fechas.`,
    link ? `\nPuedes consultarlas en: ${link}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");

  const html = layout(
    [
      escapeHtml(hello),
      `Tu solicitud de vacaciones <strong>no ha sido aprobada</strong>.`,
      `Del <strong>${from}</strong> al <strong>${to}</strong> (${days}).`,
      `Si tienes dudas, habla con el administrador. Puedes enviar una nueva solicitud con otras fechas.`,
    ],
    { href: link, label: "Ver mis vacaciones" },
  );

  await sendEmail({
    to: [v.employeeEmail],
    subject: `Vacaciones no aprobadas (${from} – ${to})`,
    html,
    text,
  });
}
