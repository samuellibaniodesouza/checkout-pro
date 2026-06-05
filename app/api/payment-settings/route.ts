import { requireAdmin } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const DEFAULT_ID = "default";

const defaultSettings = {
  id: DEFAULT_ID,
  provider: "mercado_pago",
  environment: "test",
  mercadoPagoAccessToken: "",
  mercadoPagoPublicKey: "",
  mercadoPagoAccountEmail: "",
  receiverName: "",
  manualPixEnabled: false,
  manualPixKey: "",
  manualPixKeyType: "email",
  manualPixReceiverName: "",
  manualPixBankName: "",
};

function maskToken(token?: string | null) {
  if (!token) return "";

  if (token.length <= 12) return "********";

  return `${token.slice(0, 8)}...${token.slice(-4)}`;
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const settings = await prisma.paymentSettings.upsert({
      where: {
        id: DEFAULT_ID,
      },
      update: {},
      create: defaultSettings,
    });

    return NextResponse.json({
      ...settings,
      mercadoPagoAccessTokenMasked: maskToken(settings.mercadoPagoAccessToken),
      mercadoPagoAccessToken: settings.mercadoPagoAccessToken || "",
    });
  } catch (error) {
    console.error("Erro ao buscar configurações de pagamento:", error);

    return NextResponse.json(
      { error: "Erro ao buscar configurações de pagamento." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    const current = await prisma.paymentSettings.upsert({
      where: {
        id: DEFAULT_ID,
      },
      update: {},
      create: defaultSettings,
    });

    const keepCurrentToken =
      body.mercadoPagoAccessToken === "********" ||
      body.mercadoPagoAccessToken === maskToken(current.mercadoPagoAccessToken);

    const mercadoPagoAccessToken = keepCurrentToken
      ? current.mercadoPagoAccessToken
      : body.mercadoPagoAccessToken ?? current.mercadoPagoAccessToken;

    const settings = await prisma.paymentSettings.upsert({
      where: {
        id: DEFAULT_ID,
      },
      update: {
        provider: body.provider || "mercado_pago",
        environment: body.environment || "test",

        mercadoPagoAccessToken,
        mercadoPagoPublicKey:
          body.mercadoPagoPublicKey ?? current.mercadoPagoPublicKey,
        mercadoPagoAccountEmail:
          body.mercadoPagoAccountEmail ?? current.mercadoPagoAccountEmail,
        receiverName: body.receiverName ?? current.receiverName,

        manualPixEnabled: Boolean(body.manualPixEnabled),
        manualPixKey: body.manualPixKey ?? current.manualPixKey,
        manualPixKeyType: body.manualPixKeyType ?? current.manualPixKeyType,
        manualPixReceiverName:
          body.manualPixReceiverName ?? current.manualPixReceiverName,
        manualPixBankName: body.manualPixBankName ?? current.manualPixBankName,
      },
      create: {
        ...defaultSettings,
        provider: body.provider || "mercado_pago",
        environment: body.environment || "test",

        mercadoPagoAccessToken: body.mercadoPagoAccessToken || "",
        mercadoPagoPublicKey: body.mercadoPagoPublicKey || "",
        mercadoPagoAccountEmail: body.mercadoPagoAccountEmail || "",
        receiverName: body.receiverName || "",

        manualPixEnabled: Boolean(body.manualPixEnabled),
        manualPixKey: body.manualPixKey || "",
        manualPixKeyType: body.manualPixKeyType || "email",
        manualPixReceiverName: body.manualPixReceiverName || "",
        manualPixBankName: body.manualPixBankName || "",
      },
    });

    return NextResponse.json({
      ...settings,
      mercadoPagoAccessTokenMasked: maskToken(settings.mercadoPagoAccessToken),
    });
  } catch (error) {
    console.error("Erro ao salvar configurações de pagamento:", error);

    return NextResponse.json(
      { error: "Erro ao salvar configurações de pagamento." },
      { status: 500 }
    );
  }
}
