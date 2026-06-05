import { requireAdmin } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const DEFAULT_ID = "default";

function maskToken(token?: string | null) {
  if (!token) return "";

  if (token.length <= 12) return "********";

  return `${token.slice(0, 8)}...${token.slice(-4)}`;
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const settings = await prisma.integrationSettings.upsert({
      where: {
        id: DEFAULT_ID,
      },
      update: {},
      create: {
        id: DEFAULT_ID,
        metaPixelId: "",
        metaAccessToken: "",
        metaGraphVersion: "v21.0",
        metaTestCode: "",
      },
    });

    return NextResponse.json({
      ...settings,
      metaAccessTokenMasked: maskToken(settings.metaAccessToken),
      metaAccessToken: settings.metaAccessToken || "",
    });
  } catch (error) {
    console.error("Erro ao buscar integrações:", error);

    return NextResponse.json(
      { error: "Erro ao buscar integrações." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    const current = await prisma.integrationSettings.upsert({
      where: {
        id: DEFAULT_ID,
      },
      update: {},
      create: {
        id: DEFAULT_ID,
        metaPixelId: "",
        metaAccessToken: "",
        metaGraphVersion: "v21.0",
        metaTestCode: "",
      },
    });

    const settings = await prisma.integrationSettings.upsert({
      where: {
        id: DEFAULT_ID,
      },
      update: {
        metaPixelId: body.metaPixelId ?? current.metaPixelId,
        metaAccessToken:
          body.metaAccessToken === "********"
            ? current.metaAccessToken
            : body.metaAccessToken ?? current.metaAccessToken,
        metaGraphVersion: body.metaGraphVersion || "v21.0",
        metaTestCode: body.metaTestCode ?? current.metaTestCode,
      },
      create: {
        id: DEFAULT_ID,
        metaPixelId: body.metaPixelId || "",
        metaAccessToken: body.metaAccessToken || "",
        metaGraphVersion: body.metaGraphVersion || "v21.0",
        metaTestCode: body.metaTestCode || "",
      },
    });

    return NextResponse.json({
      ...settings,
      metaAccessTokenMasked: maskToken(settings.metaAccessToken),
    });
  } catch (error) {
    console.error("Erro ao salvar integrações:", error);

    return NextResponse.json(
      { error: "Erro ao salvar integrações." },
      { status: 500 }
    );
  }
}
