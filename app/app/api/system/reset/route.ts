import { requireAdmin } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

type ResetMode = "test-data" | "all-data";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    const confirmation = String(body.confirmation || "").trim();
    const mode = String(body.mode || "") as ResetMode;

    if (confirmation !== "ZERAR") {
      return NextResponse.json(
        { error: "Confirmação inválida. Digite ZERAR para continuar." },
        { status: 400 }
      );
    }

    if (mode !== "test-data" && mode !== "all-data") {
      return NextResponse.json(
        { error: "Modo inválido." },
        { status: 400 }
      );
    }

    const result: Record<string, number> = {};

    if (mode === "test-data") {
      const deletedOrders = await prisma.order.deleteMany({});
      const deletedLeads = await prisma.lead.deleteMany({});
      const deletedExpenses = await prisma.expense.deleteMany({});

      result.orders = deletedOrders.count;
      result.leads = deletedLeads.count;
      result.expenses = deletedExpenses.count;

      return NextResponse.json({
        ok: true,
        mode,
        message: "Dados de teste apagados com sucesso.",
        result,
      });
    }

    // all-data: zera registros operacionais e cadastros criados pelo painel.
    // Mantém tabelas de configurações recriáveis por upsert.
    const deletedOrders = await prisma.order.deleteMany({});
    const deletedLeads = await prisma.lead.deleteMany({});
    const deletedExpenses = await prisma.expense.deleteMany({});
    const deletedCoupons = await prisma.coupon.deleteMany({});
    const deletedProductFiles = await prisma.productFile.deleteMany({});
    const deletedProducts = await prisma.product.deleteMany({});
    const deletedEmailTemplates = await prisma.emailTemplate.deleteMany({});

    // Configurações também são zeradas para voltar ao padrão no próximo acesso.
    await prisma.checkoutSettings.deleteMany({});
    await prisma.paymentSettings.deleteMany({});
    await prisma.integrationSettings.deleteMany({});
    await prisma.appSettings.deleteMany({});

    result.orders = deletedOrders.count;
    result.leads = deletedLeads.count;
    result.expenses = deletedExpenses.count;
    result.coupons = deletedCoupons.count;
    result.productFiles = deletedProductFiles.count;
    result.products = deletedProducts.count;
    result.emailTemplates = deletedEmailTemplates.count;

    return NextResponse.json({
      ok: true,
      mode,
      message: "Banco zerado com sucesso.",
      result,
    });
  } catch (error) {
    console.error("Erro ao zerar sistema:", error);

    return NextResponse.json(
      { error: "Erro ao zerar sistema." },
      { status: 500 }
    );
  }
}
