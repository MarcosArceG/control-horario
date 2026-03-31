import { authSafe } from "@/lib/auth-safe";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await authSafe();
  if (session) redirect("/dashboard");
  redirect("/login");
}
