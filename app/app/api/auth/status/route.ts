import { NextResponse } from "next/server";
import { getAdminFromSession, hasAdminUser } from "@/app/lib/adminAuth";

export async function GET() {
  const hasAdmin = await hasAdminUser();
  const admin = await getAdminFromSession();

  return NextResponse.json({
    hasAdmin,
    authenticated: Boolean(admin),
    admin: admin
      ? {
          id: admin.id,
          name: admin.name,
          email: admin.email,
        }
      : null,
  });
}
