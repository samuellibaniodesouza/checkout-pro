import { requireAdmin } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const DEFAULT_ID = "default";

const defaultSettings = {
  id: DEFAULT_ID,
  companyName: "Checkout Digital",
  supportEmail: "",
  supportWhatsapp: "",
  logoUrl: "",
  footerText: "Checkout seguro para produtos digitais.",
};

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const settings = await prisma.appSettings.upsert({
      where: {
        id: DEFAULT_ID,
      },
      update: {},
      create: defaultSettings,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao buscar configurações gerais:", error);

    return NextResponse.json(
      { error: "Erro ao buscar configurações gerais." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    const settings = await prisma.appSettings.upsert({
      where: {
        id: DEFAULT_ID,
      },
      update: {
        companyName: body.companyName || defaultSettings.companyName,
        supportEmail: body.supportEmail || "",
        supportWhatsapp: body.supportWhatsapp || "",
        logoUrl: body.logoUrl || "",
        footerText: body.footerText || "",
      },
      create: {
        ...defaultSettings,
        companyName: body.companyName || defaultSettings.companyName,
        supportEmail: body.supportEmail || "",
        supportWhatsapp: body.supportWhatsapp || "",
        logoUrl: body.logoUrl || "",
        footerText: body.footerText || "",
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao salvar configurações gerais:", error);

    return NextResponse.json(
      { error: "Erro ao salvar configurações gerais." },
      { status: 500 }
    );
  }
}
