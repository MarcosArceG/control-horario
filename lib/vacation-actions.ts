"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import type { Session } from "next-auth";
import type { VacationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  calendarDaysInCalendarYear,
  countCalendarDaysInclusive,
  parseDateInput,
  rangesOverlap,
  VACATION_DAYS_PER_YEAR,
} from "@/lib/vacation-days";

/** Fecha DATE de PostgreSQL → YYYY-MM-DD (UTC calendario). */
function dateFieldToYMD(d: Date): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function assertUser(session: Session | null) {
  if (!session?.user?.id) throw new Error("No autorizado.");
  return session.user;
}

function assertSuperadmin(session: Session | null) {
  const u = assertUser(session);
  if (u.role !== "SUPERADMIN") throw new Error("Acceso denegado.");
  return u;
}

function affectedYears(start: Date, end: Date): number[] {
  const ys: number[] = [];
  let y = start.getUTCFullYear();
  const endY = end.getUTCFullYear();
  while (y <= endY) {
    ys.push(y);
    y++;
  }
  return ys;
}

async function getVacationLimitForUser(userId: string): Promise<number> {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { vacationDaysPerYear: true },
  });
  if (!u) throw new Error("Usuario no encontrado.");
  return u.vacationDaysPerYear;
}

async function sumApprovedDaysInYear(
  userId: string,
  year: number,
  excludeId?: string,
): Promise<number> {
  const entries = await prisma.vacationEntry.findMany({
    where: {
      userId,
      status: "APPROVED",
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  let sum = 0;
  for (const e of entries) {
    sum += calendarDaysInCalendarYear(year, e.startDate, e.endDate);
  }
  return sum;
}

async function assertApprovedFitsLimit(
  userId: string,
  start: Date,
  end: Date,
  excludeId?: string,
) {
  const limit = await getVacationLimitForUser(userId);
  for (const y of affectedYears(start, end)) {
    const current = await sumApprovedDaysInYear(userId, y, excludeId);
    const add = calendarDaysInCalendarYear(y, start, end);
    if (current + add > limit) {
      throw new Error(
        `Supera el máximo de ${limit} días naturales en ${y} (ya hay ${current} días registrados).`,
      );
    }
  }
}

async function assertNoApprovedOverlap(
  userId: string,
  start: Date,
  end: Date,
  excludeId?: string,
) {
  const entries = await prisma.vacationEntry.findMany({
    where: {
      userId,
      status: "APPROVED",
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  const hit = entries.find((e) => rangesOverlap(start, end, e.startDate, e.endDate));
  if (hit) {
    throw new Error(
      "Las fechas se solapan con otras vacaciones ya disfrutadas (aprobadas).",
    );
  }
}

export type VacationEntryDTO = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  calendarDays: number;
  status: VacationStatus;
  note: string | null;
  createdAt: string;
};

function toDTO(e: {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  status: VacationStatus;
  note: string | null;
  createdAt: Date;
}): VacationEntryDTO {
  return {
    id: e.id,
    userId: e.userId,
    startDate: dateFieldToYMD(e.startDate),
    endDate: dateFieldToYMD(e.endDate),
    calendarDays: countCalendarDaysInclusive(e.startDate, e.endDate),
    status: e.status,
    note: e.note,
    createdAt: e.createdAt.toISOString(),
  };
}

export async function getMyVacationSummary(year: number) {
  const session = await auth();
  const user = assertUser(session);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Año no válido.");
  }

  const me = await prisma.user.findUnique({
    where: { id: user.id },
    select: { vacationDaysPerYear: true },
  });
  const entitlement = me?.vacationDaysPerYear ?? VACATION_DAYS_PER_YEAR;

  const approvedDaysInYear = await sumApprovedDaysInYear(user.id, year);

  const yStart = new Date(Date.UTC(year, 0, 1));
  const yEnd = new Date(Date.UTC(year, 11, 31));
  const calendarRows = await prisma.vacationEntry.findMany({
    where: {
      userId: user.id,
      status: { in: ["APPROVED", "PENDING"] },
      startDate: { lte: yEnd },
      endDate: { gte: yStart },
    },
    select: { startDate: true, endDate: true },
  });
  const calendarSpans = calendarRows.map((e) => ({
    start: dateFieldToYMD(e.startDate),
    end: dateFieldToYMD(e.endDate),
  }));

  return {
    year,
    entitlement,
    approvedDaysInYear,
    remaining: Math.max(0, entitlement - approvedDaysInYear),
    calendarSpans,
  };
}

export async function getAdminVacationUsers() {
  const session = await auth();
  assertSuperadmin(session);

  return prisma.user.findMany({
    where: { role: "USER" },
    orderBy: { email: "asc" },
    select: { id: true, email: true, name: true, vacationDaysPerYear: true },
  });
}

export async function getAdminVacationEntries(userId: string, year: number) {
  const session = await auth();
  assertSuperadmin(session);

  if (!userId?.trim()) throw new Error("Selecciona un empleado.");
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error("Año no válido.");
  }

  const target = await prisma.user.findFirst({
    where: { id: userId, role: "USER" },
    select: {
      id: true,
      email: true,
      name: true,
      vacationDaysPerYear: true,
    },
  });
  if (!target) throw new Error("Empleado no encontrado.");

  const entries = await prisma.vacationEntry.findMany({
    where: {
      userId,
      status: { not: "REJECTED" },
      startDate: { lte: new Date(Date.UTC(year, 11, 31)) },
      endDate: { gte: new Date(Date.UTC(year, 0, 1)) },
    },
    orderBy: { startDate: "desc" },
    include: {
      createdBy: { select: { email: true } },
    },
  });

  const approvedDaysInYear = await sumApprovedDaysInYear(userId, year);

  return {
    user: { id: target.id, email: target.email, name: target.name },
    year,
    entitlement: target.vacationDaysPerYear,
    approvedDaysInYear,
    remaining: Math.max(0, target.vacationDaysPerYear - approvedDaysInYear),
    entries: entries.map((e) => ({
      ...toDTO(e),
      createdByEmail: e.createdBy?.email ?? null,
    })),
  };
}

export async function adminCreateVacation(input: {
  userId: string;
  startDate: string;
  endDate: string;
}) {
  const session = await auth();
  const actor = assertSuperadmin(session);

  const start = parseDateInput(input.startDate);
  const end = parseDateInput(input.endDate);
  if (start > end) throw new Error("La fecha de inicio debe ser anterior al fin.");

  const target = await prisma.user.findFirst({
    where: { id: input.userId, role: "USER" },
  });
  if (!target) throw new Error("Empleado no encontrado.");

  await assertApprovedFitsLimit(target.id, start, end);
  await assertNoApprovedOverlap(target.id, start, end);

  const created = await prisma.vacationEntry.create({
    data: {
      userId: target.id,
      startDate: start,
      endDate: end,
      status: "APPROVED",
      note: null,
      createdById: actor.id,
    },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: "VACATION_ADMIN_CREATE",
    entityType: "VacationEntry",
    entityId: created.id,
    metadata: {
      subjectUserId: target.id,
      status: "APPROVED",
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
  });

  revalidatePath("/admin/vacaciones");
  revalidatePath("/vacaciones");
  return toDTO(created);
}

export async function adminApproveVacation(id: string) {
  const session = await auth();
  const actor = assertSuperadmin(session);

  const row = await prisma.vacationEntry.findUnique({ where: { id } });
  if (!row) throw new Error("Registro no encontrado.");
  if (row.status !== "PENDING") {
    throw new Error("Solo se puede aprobar una solicitud pendiente.");
  }

  await assertApprovedFitsLimit(row.userId, row.startDate, row.endDate, row.id);
  await assertNoApprovedOverlap(row.userId, row.startDate, row.endDate, row.id);

  await prisma.vacationEntry.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: "VACATION_APPROVE",
    entityType: "VacationEntry",
    entityId: id,
    metadata: { subjectUserId: row.userId },
  });

  revalidatePath("/admin/vacaciones");
  revalidatePath("/vacaciones");
}

export async function adminDeleteVacation(id: string) {
  const session = await auth();
  const actor = assertSuperadmin(session);

  const row = await prisma.vacationEntry.findUnique({ where: { id } });
  if (!row) throw new Error("Registro no encontrado.");

  await prisma.vacationEntry.delete({ where: { id } });

  await writeAuditLog({
    actorId: actor.id,
    action: "VACATION_DELETE",
    entityType: "VacationEntry",
    entityId: id,
    metadata: { subjectUserId: row.userId },
  });

  revalidatePath("/admin/vacaciones");
  revalidatePath("/vacaciones");
}

export async function adminSetUserVacationDays(input: {
  userId: string;
  vacationDaysPerYear: number;
}) {
  const session = await auth();
  const actor = assertSuperadmin(session);

  const n = input.vacationDaysPerYear;
  if (!Number.isInteger(n) || n < 0 || n > 366) {
    throw new Error("El tope debe ser un número entero entre 0 y 366.");
  }

  const target = await prisma.user.findFirst({
    where: { id: input.userId, role: "USER" },
    select: { id: true },
  });
  if (!target) throw new Error("Empleado no encontrado.");

  await prisma.user.update({
    where: { id: input.userId },
    data: { vacationDaysPerYear: n },
  });

  await writeAuditLog({
    actorId: actor.id,
    action: "VACATION_ENTITLEMENT_SET",
    entityType: "User",
    entityId: input.userId,
    metadata: { vacationDaysPerYear: n },
  });

  revalidatePath("/admin/vacaciones");
  revalidatePath("/vacaciones");
}
