import { authSafe } from "@/lib/auth-safe";
import { hasValidAppSession } from "@/lib/session-id";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await authSafe();
  if (hasValidAppSession(session)) redirect("/dashboard");
  redirect("/login");
}
