import { requireAdmin } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

function calculateDiscount({
  amount,
  type,
  value,
}: {
  amount: number;
  type: string;
  value: number;
}) {
  if (type === "fixed") {
    return Math.min(amount, value);
  }

  return Math.min(amount, amount * (value / 100));
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    if (!body.code || !body.amount) {
      return NextResponse.json(
        { error: "Código e valor do pedido são obrigatórios." },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);
    const code = normalizeCode(body.code);

    const coupon = await prisma.coupon.findUnique({
      where: {
        code,
      },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Cupom não encontrado." },
        { status: 404 }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "Este cupom está desativado." },
        { status: 400 }
      );
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Este cupom expirou." },
        { status: 400 }
      );
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "Este cupom atingiu o limite de uso." },
        { status: 400 }
      );
    }

    const discount = calculateDiscount({
      amount,
      type: coupon.type,
      value: coupon.value,
    });

    const finalAmount = Math.max(0, amount - discount);

    return NextResponse.json({
      ok: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
      discount,
      finalAmount,
    });
  } catch (error) {
    console.error("Erro ao validar cupom:", error);

    return NextResponse.json(
      { error: "Erro ao validar cupom." },
      { status: 500 }
    );
  }
}
