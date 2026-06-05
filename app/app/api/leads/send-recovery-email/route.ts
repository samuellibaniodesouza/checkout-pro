import { requireAdmin } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { sendLeadRecoveryEmail } from "@/app/lib/sendLeadRecoveryEmail";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    if (!body.leadId) {
      return NextResponse.json(
        { error: "ID do lead não informado." },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({
      where: {
        id: body.leadId,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado." },
        { status: 404 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const checkoutUrl = lead.productSlug
      ? `${siteUrl}/checkout/${lead.productSlug}`
      : siteUrl;

    const result = await sendLeadRecoveryEmail({
      to: lead.customerEmail,
      customerName: lead.customerName,
      productName: lead.productName,
      checkoutUrl,
      step: 1,
    });

    if ("ok" in result && result.ok === false) {
      return NextResponse.json(
        { error: "Erro ao enviar e-mail de recuperação.", result },
        { status: 500 }
      );
    }

    const updatedLead = await prisma.lead.update({
      where: {
        id: lead.id,
      },
      data: {
        status: "contacted",
        notes: "E-mail de recuperação enviado manualmente.",
        recoveryEmail1SentAt: new Date(),
        lastRecoverySentAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "E-mail de recuperação enviado.",
      result,
      lead: updatedLead,
    });
  } catch (error) {
    console.error("Erro ao enviar recuperação:", error);

    return NextResponse.json(
      { error: "Erro ao enviar recuperação." },
      { status: 500 }
    );
  }
}
