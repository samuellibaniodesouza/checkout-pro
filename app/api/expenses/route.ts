import { requireAdmin } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const expenses = await prisma.expense.findMany({
      orderBy: {
        expenseDate: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Erro ao buscar gastos:", error);

    return NextResponse.json(
      { error: "Erro ao buscar gastos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    if (!body.title || !body.category || !body.amount) {
      return NextResponse.json(
        { error: "Título, categoria e valor são obrigatórios." },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        title: body.title,
        category: body.category,
        amount: Number(body.amount),
        notes: body.notes || "",
        expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("Erro ao criar gasto:", error);

    return NextResponse.json(
      { error: "Erro ao criar gasto." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    if (!body.expenseId) {
      return NextResponse.json(
        { error: "ID do gasto não informado." },
        { status: 400 }
      );
    }

    await prisma.expense.delete({
      where: {
        id: body.expenseId,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Gasto removido com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao remover gasto:", error);

    return NextResponse.json(
      { error: "Erro ao remover gasto." },
      { status: 500 }
    );
  }
}
