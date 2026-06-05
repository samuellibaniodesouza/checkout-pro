import { requireAdmin } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const defaultTemplates = [
  {
    key: "access_granted",
    name: "Acesso liberado",
    subject: "Seu acesso foi liberado",
    headline: "Pagamento aprovado ✅",
    body: "Olá, {{customerName}}. Seu acesso ao produto {{productName}} foi liberado com sucesso.",
    buttonText: "Acessar área de membros",
    footer: "Este e-mail foi enviado automaticamente após a confirmação do pagamento.",
  },
  {
    key: "lead_recovery_1",
    name: "Recuperação 1",
    subject: "Sua compra ficou pendente",
    headline: "Sua compra ficou pendente",
    body: "Olá, {{customerName}}. Vi que você iniciou sua compra do produto {{productName}}, mas ainda não concluiu.",
    buttonText: "Concluir minha compra",
    footer: "Você recebeu este e-mail porque iniciou o checkout e não finalizou o pagamento.",
  },
  {
    key: "lead_recovery_2",
    name: "Recuperação 2",
    subject: "Ainda quer finalizar seu acesso?",
    headline: "Seu acesso ainda está disponível",
    body: "Olá, {{customerName}}. Sua compra do produto {{productName}} ainda está pendente.",
    buttonText: "Finalizar agora",
    footer: "Você recebeu este e-mail porque iniciou o checkout e não finalizou o pagamento.",
  },
  {
    key: "lead_recovery_3",
    name: "Recuperação 3",
    subject: "Último lembrete sobre sua compra",
    headline: "Último lembrete",
    body: "Olá, {{customerName}}. Esta é uma última lembrança sobre o produto {{productName}}.",
    buttonText: "Garantir meu acesso",
    footer: "Você recebeu este e-mail porque iniciou o checkout e não finalizou o pagamento.",
  },
  {
    key: "upsell_offer",
    name: "Oferta complementar",
    subject: "Uma oferta especial para completar seu acesso",
    headline: "Oferta exclusiva para alunos",
    body: "Olá, {{customerName}}. Você pode complementar seu acesso com uma oferta especial relacionada ao produto {{productName}}.",
    buttonText: "Ver oferta especial",
    footer: "Oferta opcional disponível por tempo limitado.",
  },
];

async function ensureDefaultTemplates() {
  for (const template of defaultTemplates) {
    await prisma.emailTemplate.upsert({
      where: {
        key: template.key,
      },
      update: {},
      create: template,
    });
  }
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    await ensureDefaultTemplates();

    const templates = await prisma.emailTemplate.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Erro ao buscar templates:", error);

    return NextResponse.json(
      { error: "Erro ao buscar templates." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    if (!body.templateId) {
      return NextResponse.json(
        { error: "ID do template não informado." },
        { status: 400 }
      );
    }

    const template = await prisma.emailTemplate.update({
      where: {
        id: body.templateId,
      },
      data: {
        name: body.name,
        subject: body.subject,
        headline: body.headline,
        body: body.body,
        buttonText: body.buttonText,
        footer: body.footer,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Erro ao salvar template:", error);

    return NextResponse.json(
      { error: "Erro ao salvar template." },
      { status: 500 }
    );
  }
}
