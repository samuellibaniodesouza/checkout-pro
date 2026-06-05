import { NextResponse } from "next/server";
import { clearSessionCookie, deleteCurrentSession } from "@/app/lib/adminAuth";

export async function POST() {
  await deleteCurrentSession();

  const response = NextResponse.json({
    ok: true,
    message: "Logout realizado.",
  });

  return clearSessionCookie(response);
}
