import { requireAdmin } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const DEFAULT_SETTINGS_ID = "default";

const defaultSettings = {
  id: DEFAULT_SETTINGS_ID,
  checkoutTitle: "Finalize sua compra com segurança",
  checkoutSubtitle: "Produto digital com acesso após confirmação do pagamento.",
  checkoutButtonText: "Comprar agora com segurança",
  checkoutGuaranteeText:
    "Seus dados estão protegidos. Não armazenamos dados de cartão.",
  primaryColor: "#16a34a",
  secondaryColor: "#7e22ce",
  orderBumpEnabled: true,
  orderBumpName: "Kit Fornecedores Premium",
  orderBumpDescription:
    "Receba uma lista prática com fornecedores, ideias de compra de matéria-prima e caminhos para começar vendendo mais rápido.",
  orderBumpPrice: 9.9,
  orderBumpOldPrice: 19.9,
  orderBumpBadge: "Oferta rápida",
  orderBumpButtonText: "adicionar ao pedido",
  orderBumpBenefits:
    "Lista de fornecedores\nMatérias-primas\nIdeias para revenda\nAcesso imediato",
};

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const settings = await prisma.checkoutSettings.upsert({
      where: {
        id: DEFAULT_SETTINGS_ID,
      },
      update: {},
      create: defaultSettings,
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);

    return NextResponse.json(
      { error: "Erro ao buscar configurações." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    const settings = await prisma.checkoutSettings.upsert({
      where: {
        id: DEFAULT_SETTINGS_ID,
      },
      update: {
        checkoutTitle: body.checkoutTitle || defaultSettings.checkoutTitle,
        checkoutSubtitle:
          body.checkoutSubtitle || defaultSettings.checkoutSubtitle,
        checkoutButtonText:
          body.checkoutButtonText || defaultSettings.checkoutButtonText,
        checkoutGuaranteeText:
          body.checkoutGuaranteeText || defaultSettings.checkoutGuaranteeText,
        primaryColor: body.primaryColor || defaultSettings.primaryColor,
        secondaryColor: body.secondaryColor || defaultSettings.secondaryColor,

        orderBumpEnabled: body.orderBumpEnabled ?? true,
        orderBumpName: body.orderBumpName || defaultSettings.orderBumpName,
        orderBumpDescription:
          body.orderBumpDescription || defaultSettings.orderBumpDescription,
        orderBumpPrice: Number(body.orderBumpPrice || defaultSettings.orderBumpPrice),
        orderBumpOldPrice: Number(
          body.orderBumpOldPrice || defaultSettings.orderBumpOldPrice
        ),
        orderBumpBadge: body.orderBumpBadge || defaultSettings.orderBumpBadge,
        orderBumpButtonText:
          body.orderBumpButtonText || defaultSettings.orderBumpButtonText,
        orderBumpBenefits:
          body.orderBumpBenefits || defaultSettings.orderBumpBenefits,
      },
      create: {
        ...defaultSettings,
        checkoutTitle: body.checkoutTitle || defaultSettings.checkoutTitle,
        checkoutSubtitle:
          body.checkoutSubtitle || defaultSettings.checkoutSubtitle,
        checkoutButtonText:
          body.checkoutButtonText || defaultSettings.checkoutButtonText,
        checkoutGuaranteeText:
          body.checkoutGuaranteeText || defaultSettings.checkoutGuaranteeText,
        primaryColor: body.primaryColor || defaultSettings.primaryColor,
        secondaryColor: body.secondaryColor || defaultSettings.secondaryColor,

        orderBumpEnabled: body.orderBumpEnabled ?? true,
        orderBumpName: body.orderBumpName || defaultSettings.orderBumpName,
        orderBumpDescription:
          body.orderBumpDescription || defaultSettings.orderBumpDescription,
        orderBumpPrice: Number(body.orderBumpPrice || defaultSettings.orderBumpPrice),
        orderBumpOldPrice: Number(
          body.orderBumpOldPrice || defaultSettings.orderBumpOldPrice
        ),
        orderBumpBadge: body.orderBumpBadge || defaultSettings.orderBumpBadge,
        orderBumpButtonText:
          body.orderBumpButtonText || defaultSettings.orderBumpButtonText,
        orderBumpBenefits:
          body.orderBumpBenefits || defaultSettings.orderBumpBenefits,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Erro ao salvar configurações:", error);

    return NextResponse.json(
      { error: "Erro ao salvar configurações." },
      { status: 500 }
    );
  }
}
