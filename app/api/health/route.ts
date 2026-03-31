import { NextResponse } from "next/server";

/** Comprueba que el despliegue responde sin tocar BD ni sesión. */
export function GET() {
  return NextResponse.json({ ok: true });
}
