import { writeAuditLog } from "@/lib/audit";

export async function logSignIn(user: { id?: string; email?: string | null }) {
  if (!user?.id) return;
  try {
    await writeAuditLog({
      actorId: user.id,
      action: "AUTH_LOGIN",
      entityType: "User",
      entityId: user.id,
      metadata: { email: user.email },
    });
  } catch (e) {
    // No tumbar el login si la BD falla al auditar (evita /api/auth/error "Server error").
    console.error("[auth] logSignIn audit:", e);
  }
}
