import { requireAdmin } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { sendLeadRecoveryEmail } from "@/app/lib/sendLeadRecoveryEmail";

function minutesAgo(date: Date) {
  return (Date.now() - date.getTime()) / 1000 / 60;
}

async function leadHasConverted(lead: {
  customerEmail: string;
  productId: string | null;
}) {
  const order = await prisma.order.findFirst({
    where: {
      customerEmail: lead.customerEmail,
      paymentStatus: "paid",
      ...(lead.productId
        ? {
            productId: lead.productId,
          }
        : {}),
    },
  });

  return Boolean(order);
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const leads = await prisma.lead.findMany({
      where: {
        status: {
          in: ["abandoned", "contacted"],
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 50,
    });

    const results: unknown[] = [];

    for (const lead of leads) {
      const converted = await leadHasConverted({
        customerEmail: lead.customerEmail,
        productId: lead.productId,
      });

      if (converted) {
        const updatedLead = await prisma.lead.update({
          where: {
            id: lead.id,
          },
          data: {
            status: "converted",
            notes: "Convertido automaticamente por pedido pago.",
          },
        });

        results.push({
          leadId: lead.id,
          action: "marked_converted",
          lead: updatedLead,
        });

        continue;
      }

      const ageMinutes = minutesAgo(lead.createdAt);
      let step: 1 | 2 | 3 | null = null;

      if (ageMinutes >= 24 * 60 && !lead.recoveryEmail3SentAt) {
        step = 3;
      } else if (ageMinutes >= 120 && !lead.recoveryEmail2SentAt) {
        step = 2;
      } else if (ageMinutes >= 30 && !lead.recoveryEmail1SentAt) {
        step = 1;
      }

      if (!step) {
        results.push({
          leadId: lead.id,
          action: "not_due",
          ageMinutes: Math.floor(ageMinutes),
        });

        continue;
      }

      const checkoutUrl = lead.productSlug
        ? `${siteUrl}/checkout/${lead.productSlug}`
        : siteUrl;

      const emailResult = await sendLeadRecoveryEmail({
        to: lead.customerEmail,
        customerName: lead.customerName,
        productName: lead.productName,
        checkoutUrl,
        step,
      });

      const data =
        step === 1
          ? {
              status: "contacted",
              recoveryEmail1SentAt: new Date(),
              lastRecoverySentAt: new Date(),
              notes: "Recuperação automática 1 enviada.",
            }
          : step === 2
          ? {
              status: "contacted",
              recoveryEmail2SentAt: new Date(),
              lastRecoverySentAt: new Date(),
              notes: "Recuperação automática 2 enviada.",
            }
          : {
              status: "contacted",
              recoveryEmail3SentAt: new Date(),
              lastRecoverySentAt: new Date(),
              notes: "Recuperação automática 3 enviada.",
            };

      const updatedLead = await prisma.lead.update({
        where: {
          id: lead.id,
        },
        data,
      });

      results.push({
        leadId: lead.id,
        action: `sent_step_${step}`,
        emailResult,
        lead: updatedLead,
      });
    }

    return NextResponse.json({
      ok: true,
      checked: leads.length,
      results,
    });
  } catch (error) {
    console.error("Erro na recuperação automática:", error);

    return NextResponse.json(
      { error: "Erro na recuperação automática." },
      { status: 500 }
    );
  }
}

export async function POST() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  return GET();
}
