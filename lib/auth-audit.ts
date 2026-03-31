import { writeAuditLog } from "@/lib/audit";

export async function logSignIn(user: { id?: string; email?: string | null }) {
  if (!user?.id) return;
  await writeAuditLog({
    actorId: user.id,
    action: "AUTH_LOGIN",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email },
  });
}
