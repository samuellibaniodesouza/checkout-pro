import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.integrationSettings.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json({
      pixelId:
        settings?.metaPixelId ||
        process.env.NEXT_PUBLIC_META_PIXEL_ID ||
        process.env.META_PIXEL_ID ||
        "",
    });
  } catch {
    return NextResponse.json({
      pixelId:
        process.env.NEXT_PUBLIC_META_PIXEL_ID ||
        process.env.META_PIXEL_ID ||
        "",
    });
  }
}
