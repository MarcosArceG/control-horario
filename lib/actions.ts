"use server";

import { prisma } from "@/lib/prisma";
import {
  redirectToLoginClearingSession,
  sessionSuperadminOrRedirect,
  sessionSuperadminOrThrow,
  sessionUserOrRedirect,
  sessionUserOrThrow,
} from "@/lib/auth-safe";
import { writeAuditLog } from "@/lib/audit";
import {
  deriveSessionState,
  getOpenSessionStart,
  localDayBounds,
  mondayOfWeek,
  toEffectiveEvents,
  type SessionState,
  workedMsByUserDay,
  workedMsInRange,
} from "@/lib/time";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import type { TimeEventType } from "@prisma/client";
import {
  envSuperadminCount,
  isEnvSuperadminEmail,
} from "@/lib/superadmin-env";

const TARGET_DAY_MS = 8 * 60 * 60 * 1000;
const TARGET_WEEK_MS = 40 * 60 * 60 * 1000;

function firstDisplayName(name: string | null | undefined, email: string) {
  const raw = (name?.trim() || email.split("@")[0] || "Usuario").split(/\s+/)[0];
  return raw ? raw[0].toUpperCase() + raw.slice(1) : "Usuario";
}

export type DashboardWeekDay = {
  dateISO: string;
  weekdayShort: string;
  dayNum: number;
  workedMs: number;
  isToday: boolean;
};

export type DashboardLiveMetrics = {
  state: SessionState;
  workedTodayMs: number;
  workedWeekMs: number;
  remainingDayMs: number;
  remainingWeekMs: number;
  targetDayMs: number;
  targetWeekMs: number;
  weekDays: DashboardWeekDay[];
  sessionStart: string | null;
};

async function computeDashboardMetrics(userId: string): Promise<DashboardLiveMetrics> {
  const events = await prisma.timeEvent.findMany({
    where: { userId },
    orderBy: { occurredAt: "asc" },
  });
  const corrections = await prisma.timeCorrection.findMany({
    where: { userId },
  });
  const effective = toEffectiveEvents(events, corrections);
  const state = deriveSessionState(effective);
  const now = new Date();
  const sessionStart = getOpenSessionStart(effective);

  const todayBounds = localDayBounds(now);
  const workedTodayMs = workedMsInRange(
    effective,
    todayBounds.start,
    todayBounds.end,
    now,
  );

  const weekStart = mondayOfWeek(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const workedWeekMs = workedMsInRange(effective, weekStart, weekEnd, now);

  const weekdayLabels = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
  const weekDays: DashboardWeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const { start, end } = localDayBounds(d);
    const isToday = start.getTime() === todayBounds.start.getTime();
    let workedMs: number;
    if (start.getTime() > todayBounds.start.getTime()) {
      workedMs = 0;
    } else if (isToday) {
      workedMs = workedMsInRange(effective, start, end, now);
    } else {
      workedMs = workedMsInRange(effective, start, end);
    }
    weekDays.push({
      dateISO: start.toISOString(),
      weekdayShort: weekdayLabels[i],
      dayNum: d.getDate(),
      workedMs,
      isToday,
    });
  }

  const remainingDayMs = Math.max(0, TARGET_DAY_MS - workedTodayMs);
  const remainingWeekMs = Math.max(0, TARGET_WEEK_MS - workedWeekMs);

  return {
    state,
    workedTodayMs,
    workedWeekMs,
    remainingDayMs,
    remainingWeekMs,
    targetDayMs: TARGET_DAY_MS,
    targetWeekMs: TARGET_WEEK_MS,
    weekDays,
    sessionStart: sessionStart?.toISOString() ?? null,
  };
}

/** Actualiza métricas del panel sin recargar (llamada desde el cliente). */
export async function getDashboardLiveMetrics(): Promise<DashboardLiveMetrics> {
  const user = await sessionUserOrThrow();
  return computeDashboardMetrics(user.id);
}

export async function getDashboardData() {
  const user = await sessionUserOrRedirect();
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });
  if (!dbUser) {
    redirectToLoginClearingSession();
  }
  const displayName = firstDisplayName(
    dbUser.name,
    dbUser.email ?? user.email ?? "",
  );

  const metrics = await computeDashboardMetrics(user.id);

  return {
    displayName,
    ...metrics,
  };
}

export async function registerClockEvent(type: TimeEventType) {
  const user = await sessionUserOrThrow();

  const events = await prisma.timeEvent.findMany({
    where: { userId: user.id },
    orderBy: { occurredAt: "asc" },
  });
  const corrections = await prisma.timeCorrection.findMany({
    where: { userId: user.id },
  });
  const effective = toEffectiveEvents(events, corrections);
  const state = deriveSessionState(effective);

  const now = new Date();

  if (type === "BREAK_START" || type === "BREAK_END") {
    throw new Error("Las pausas ya no están disponibles en la aplicación.");
  }

  if (type === "CLOCK_IN") {
    if (state.kind !== "idle") {
      throw new Error(
        "Debes registrar la salida antes de una nueva entrada.",
      );
    }
  } else if (type === "CLOCK_OUT") {
    if (state.kind !== "working" && state.kind !== "on_break") {
      throw new Error(
        "Solo puedes registrar la salida con una jornada activa.",
      );
    }
  }

  const created = await prisma.timeEvent.create({
    data: {
      userId: user.id,
      type,
      occurredAt: now,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "TIME_EVENT_CREATE",
    entityType: "TimeEvent",
    entityId: created.id,
    metadata: { type, occurredAt: now.toISOString() },
  });

  revalidatePath("/dashboard");
  return created;
}

export async function requestTimeCorrection(input: {
  timeEventId: string;
  proposedOccurredAt: string;
  reason: string;
}) {
  const user = await sessionUserOrThrow();

  const event = await prisma.timeEvent.findFirst({
    where: { id: input.timeEventId, userId: user.id },
  });
  if (!event) throw new Error("Evento no encontrado.");

  const proposed = new Date(input.proposedOccurredAt);
  if (Number.isNaN(proposed.getTime())) throw new Error("Fecha no válida.");

  const correction = await prisma.timeCorrection.create({
    data: {
      userId: user.id,
      timeEventId: event.id,
      proposedOccurredAt: proposed,
      reason: input.reason.trim(),
      requestedById: user.id,
    },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "TIME_CORRECTION_CREATE",
    entityType: "TimeCorrection",
    entityId: correction.id,
    metadata: {
      timeEventId: event.id,
      proposedOccurredAt: proposed.toISOString(),
    },
  });

  revalidatePath("/corrections");
  revalidatePath("/admin/corrections");
  return correction;
}

export async function adminCreateUser(input: {
  email: string;
  password: string;
  name?: string;
}) {
  const actor = await sessionSuperadminOrThrow();

  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || input.password.length < 8) {
    throw new Error(
      "Correo o contraseña no válidos (mínimo 8 caracteres en la contraseña).",
    );
  }

  if (isEnvSuperadminEmail(email)) {
    throw new Error(
      "Este correo está reservado para un superadministrador del .env. Usa otro correo.",
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const created = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name?.trim() || null,
      role: "USER",
    },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: "USER_CREATE",
    entityType: "User",
    entityId: created.id,
    metadata: { email: created.email, role: created.role },
  });

  revalidatePath("/admin/users");
  return created;
}

export async function adminReviewCorrection(
  correctionId: string,
  decision: "APPROVED" | "REJECTED",
  reviewNote?: string,
) {
  const actor = await sessionSuperadminOrThrow();

  const existing = await prisma.timeCorrection.findUnique({
    where: { id: correctionId },
  });
  if (!existing || existing.status !== "PENDING") {
    throw new Error("La corrección no está pendiente.");
  }

  const updated = await prisma.timeCorrection.update({
    where: { id: correctionId },
    data: {
      status: decision,
      reviewedById: actor.id,
      reviewedAt: new Date(),
      reviewNote: reviewNote?.trim() || null,
    },
  });

  await writeAuditLog({
    actorId: actor.id,
    action:
      decision === "APPROVED"
        ? "TIME_CORRECTION_APPROVE"
        : "TIME_CORRECTION_REJECT",
    entityType: "TimeCorrection",
    entityId: updated.id,
    metadata: {
      subjectUserId: updated.userId,
      timeEventId: updated.timeEventId,
      decision,
    },
  });

  revalidatePath("/admin/corrections");
  revalidatePath("/dashboard");
  return updated;
}

export async function getMyTimeEventsForCorrections() {
  const user = await sessionUserOrRedirect();
  return prisma.timeEvent.findMany({
    where: { userId: user.id },
    orderBy: { occurredAt: "desc" },
    take: 100,
  });
}

export async function getMyCorrectionRequests() {
  const user = await sessionUserOrRedirect();
  const [pending, past] = await Promise.all([
    prisma.timeCorrection.findMany({
      where: { userId: user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { timeEvent: true },
    }),
    prisma.timeCorrection.findMany({
      where: {
        userId: user.id,
        status: { in: ["APPROVED", "REJECTED"] },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { timeEvent: true },
    }),
  ]);
  return { pending, past };
}

export async function getAdminTimeLogs() {
  await sessionSuperadminOrRedirect();

  return prisma.timeEvent.findMany({
    orderBy: { occurredAt: "desc" },
    take: 500,
    include: {
      user: { select: { email: true, name: true } },
    },
  });
}

export async function getAdminPendingCorrections() {
  await sessionSuperadminOrRedirect();

  return prisma.timeCorrection.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      subject: { select: { email: true, name: true } },
      timeEvent: true,
      requestedBy: { select: { email: true } },
    },
  });
}

export async function getAdminUsers() {
  await sessionSuperadminOrRedirect();

  return prisma.user.findMany({
    orderBy: { email: "asc" },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });
}

export async function adminDeleteUser(userId: string) {
  const actor = await sessionSuperadminOrThrow();
  if (actor.id === userId) {
    throw new Error("No puedes eliminar tu propia cuenta.");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("Usuario no encontrado.");

  if (target.role === "SUPERADMIN") {
    if (isEnvSuperadminEmail(target.email)) {
      throw new Error(
        "Este correo está en SUPERADMIN_ACCOUNTS. Elimínalo del .env y despliega antes de borrar la cuenta.",
      );
    }
    const superAdmins = await prisma.user.count({
      where: { role: "SUPERADMIN" },
    });
    const envCount = envSuperadminCount();
    if (superAdmins <= 1 && envCount === 0) {
      throw new Error("No se puede eliminar el único superadministrador.");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.timeCorrection.deleteMany({ where: { requestedById: userId } });
    await tx.timeCorrection.updateMany({
      where: { reviewedById: userId },
      data: { reviewedById: null },
    });
    await tx.user.delete({ where: { id: userId } });
  });

  await writeAuditLog({
    actorId: actor.id,
    action: "USER_DELETE",
    entityType: "User",
    entityId: userId,
    metadata: { email: target.email, role: target.role },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/time-logs");
  revalidatePath("/admin/corrections");
}

export async function adminSetUserPassword(input: {
  userId: string;
  newPassword: string;
}) {
  const actor = await sessionSuperadminOrThrow();
  const pw = input.newPassword.trim();
  if (pw.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres.");
  }

  const target = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!target) throw new Error("Usuario no encontrado.");

  if (target.role !== "USER") {
    throw new Error(
      "Solo se puede restablecer la contraseña de trabajadores (rol usuario).",
    );
  }

  if (isEnvSuperadminEmail(target.email)) {
    throw new Error(
      "Este correo está gestionado por variables de entorno; no se puede cambiar aquí.",
    );
  }

  const hash = await bcrypt.hash(pw, 12);
  await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash: hash },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: "USER_PASSWORD_RESET",
    entityType: "User",
    entityId: target.id,
    metadata: { subjectEmail: target.email },
  });

  revalidatePath("/admin/users");
}

export async function getAdminAuditLogs() {
  await sessionSuperadminOrRedirect();

  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { actor: { select: { email: true } } },
  });
}

export async function exportWorkedHoursCsv(input: {
  from: string;
  to: string;
  /** Si se indica, solo ese trabajador; si no, todos. */
  userId?: string | null;
}) {
  const user = await sessionSuperadminOrRedirect();

  const from = new Date(input.from);
  const to = new Date(input.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    throw new Error("Rango de fechas no válido.");
  }

  const filterId = input.userId?.trim() || null;

  const users = await prisma.user.findMany({
    where: filterId ? { id: filterId } : undefined,
    select: { id: true, email: true, name: true },
  });

  if (filterId && users.length === 0) {
    throw new Error("Trabajador no encontrado.");
  }

  const userIds = users.map((u) => u.id);
  const allEvents = await prisma.timeEvent.findMany({
    where: { userId: { in: userIds } },
  });
  const allCorrections = await prisma.timeCorrection.findMany({
    where: { userId: { in: userIds } },
  });

  await writeAuditLog({
    actorId: user.id,
    action: "CSV_EXPORT_WORKED_HOURS",
    entityType: "Export",
    entityId: null,
    metadata: {
      from: from.toISOString(),
      to: to.toISOString(),
      userId: filterId ?? "all",
    },
  });

  const lines: string[] = ["correo,nombre,fecha,horas_trabajadas"];

  for (const u of users) {
    const events = allEvents.filter((e) => e.userId === u.id);
    const corrections = allCorrections.filter((c) => c.userId === u.id);
    const effective = toEffectiveEvents(events, corrections);
    const byDay = workedMsByUserDay(effective, from, to);

    for (const [day, ms] of byDay) {
      const hours = (ms / 3_600_000).toFixed(2);
      const name = u.name ?? "";
      lines.push(
        `${escapeCsv(u.email)},${escapeCsv(name)},${day},${hours}`,
      );
    }
  }

  return lines.join("\n");
}

function escapeCsv(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
