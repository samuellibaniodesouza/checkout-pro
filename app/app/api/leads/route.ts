import { requireAdmin } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const leads = await prisma.lead.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("Erro ao buscar leads:", error);

    return NextResponse.json(
      { error: "Erro ao buscar leads." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    if (!body.customerName || !body.customerEmail || !body.productName) {
      return NextResponse.json(
        { error: "Nome, e-mail e produto são obrigatórios." },
        { status: 400 }
      );
    }

    const existingLead = await prisma.lead.findFirst({
      where: {
        customerEmail: body.customerEmail,
        productId: body.productId || undefined,
        status: "abandoned",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingLead) {
      const updatedLead = await prisma.lead.update({
        where: {
          id: existingLead.id,
        },
        data: {
          customerName: body.customerName,
          customerPhone: body.customerPhone || existingLead.customerPhone,
          customerCpf: body.customerCpf || existingLead.customerCpf,
          productName: body.productName,
          productSlug: body.productSlug || existingLead.productSlug,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json(updatedLead);
    }

    const lead = await prisma.lead.create({
      data: {
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone || "",
        customerCpf: body.customerCpf || "",

        productId: body.productId || null,
        productName: body.productName,
        productSlug: body.productSlug || "",

        status: "abandoned",
        source: body.source || "checkout",
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Erro ao salvar lead:", error);

    return NextResponse.json(
      { error: "Erro ao salvar lead." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
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

    const updatedLead = await prisma.lead.update({
      where: {
        id: body.leadId,
      },
      data: {
        status: body.status || "contacted",
        notes: body.notes || undefined,
      },
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);

    return NextResponse.json(
      { error: "Erro ao atualizar lead." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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

    await prisma.lead.delete({
      where: {
        id: body.leadId,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Lead removido com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao remover lead:", error);

    return NextResponse.json(
      { error: "Erro ao remover lead." },
      { status: 500 }
    );
  }
}
