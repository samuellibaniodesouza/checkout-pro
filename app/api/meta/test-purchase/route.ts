import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function sha256(value: string) {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function POST() {
  try {
    const settings = await prisma.integrationSettings.upsert({
      where: {
        id: "default",
      },
      update: {},
      create: {
        id: "default",
        metaPixelId: "",
        metaAccessToken: "",
        metaGraphVersion: "v21.0",
        metaTestCode: "",
      },
    });

    const pixelId =
      settings.metaPixelId ||
      process.env.NEXT_PUBLIC_META_PIXEL_ID ||
      process.env.META_PIXEL_ID;

    const accessToken =
      settings.metaAccessToken || process.env.META_ACCESS_TOKEN;

    const graphVersion =
      settings.metaGraphVersion || process.env.META_GRAPH_VERSION || "v21.0";

    if (!pixelId) {
      return NextResponse.json(
        { error: "Pixel ID não configurado." },
        { status: 400 }
      );
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access Token da Meta não configurado." },
        { status: 400 }
      );
    }

    const testEventCode = settings.metaTestCode || undefined;

    const eventId = `test_${Date.now()}`;

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          event_source_url:
            process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          user_data: {
            em: [sha256("teste@checkout.com")],
            ph: [sha256("11999999999")],
          },
          custom_data: {
            currency: "BRL",
            value: 9.9,
            content_name: "Teste de Purchase",
            content_ids: ["produto-teste"],
            content_type: "product",
          },
        },
      ],
    };

    if (testEventCode) {
      payload.test_event_code = testEventCode;
    }

    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Erro ao enviar evento para Meta.",
          metaResponse: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Evento Purchase de teste enviado para Meta.",
      eventId,
      pixelId,
      graphVersion,
      testEventCode: testEventCode || null,
      metaResponse: data,
    });
  } catch (error) {
    console.error("Erro no teste Meta:", error);

    return NextResponse.json(
      { error: "Erro ao testar Meta Pixel." },
      { status: 500 }
    );
  }
}
