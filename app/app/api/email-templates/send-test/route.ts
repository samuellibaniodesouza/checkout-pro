import { requireAdmin } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function replaceVariables(text: string, variables: Record<string, string>) {
  let result = text;

  Object.entries(variables).forEach(([key, value]) => {
    result = result.replaceAll(`{{${key}}}`, value);
  });

  return result;
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    if (!body.templateId || !body.to) {
      return NextResponse.json(
        { error: "Template e e-mail de destino são obrigatórios." },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.findUnique({
      where: {
        id: body.templateId,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template não encontrado." },
        { status: 404 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail =
      process.env.EMAIL_FROM || "Checkout Digital <onboarding@resend.dev>";

    if (!resendApiKey) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: "RESEND_API_KEY não configurado. E-mail não enviado.",
      });
    }

    const variables = {
      customerName: "Cliente Teste",
      productName: "Produto Digital",
      accessUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      checkoutUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      offerUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    };

    const subject = replaceVariables(template.subject, variables);
    const headline = replaceVariables(template.headline, variables);
    const contentBody = replaceVariables(template.body, variables);
    const buttonText = replaceVariables(template.buttonText, variables);
    const footer = replaceVariables(template.footer || "", variables);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: body.to,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; background: #f4f4f5; padding: 32px;">
            <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 28px;">
              <h1 style="color: #111827; margin-bottom: 12px;">${headline}</h1>

              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                ${contentBody}
              </p>

              <a
                href="${variables.accessUrl}"
                style="display: inline-block; margin-top: 18px; background: #16a34a; color: #ffffff; padding: 14px 22px; border-radius: 12px; text-decoration: none; font-weight: bold;"
              >
                ${buttonText}
              </a>

              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

              <p style="color: #6b7280; font-size: 12px;">
                ${footer}
              </p>
            </div>
          </div>
        `,
        text: `${headline}\n\n${contentBody}`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Erro ao enviar e-mail de teste.", data },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "E-mail de teste enviado.",
      data,
    });
  } catch (error) {
    console.error("Erro ao enviar teste:", error);

    return NextResponse.json(
      { error: "Erro ao enviar teste." },
      { status: 500 }
    );
  }
}
