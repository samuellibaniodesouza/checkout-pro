import { requireAdmin } from "@/app/lib/adminAuth";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

function normalizeCode(code: string) {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

async function getCouponsWithMetrics() {
  const coupons = await prisma.coupon.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  const paidOrdersWithCoupon = await prisma.order.findMany({
    where: {
      paymentStatus: "paid",
      couponCode: {
        not: null,
      },
    },
  });

  return coupons.map((coupon: { code: string }) => {
    const couponOrders = paidOrdersWithCoupon.filter(
      (order: { couponCode: string | null }) => order.couponCode === coupon.code
    );

    const revenue = couponOrders.reduce(
      (sum: number, order: { amount: number }) => sum + order.amount,
      0
    );

    const discountTotal = couponOrders.reduce(
      (sum: number, order: { couponDiscount: number }) =>
        sum + Number(order.couponDiscount || 0),
      0
    );

    return {
      ...coupon,
      paidOrdersCount: couponOrders.length,
      revenue,
      discountTotal,
    };
  });
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const coupons = await getCouponsWithMetrics();

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Erro ao buscar cupons:", error);

    return NextResponse.json(
      { error: "Erro ao buscar cupons." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    if (!body.code || !body.type || !body.value) {
      return NextResponse.json(
        { error: "Código, tipo e valor são obrigatórios." },
        { status: 400 }
      );
    }

    const code = normalizeCode(body.code);

    const existingCoupon = await prisma.coupon.findUnique({
      where: {
        code,
      },
    });

    if (existingCoupon) {
      return NextResponse.json(
        { error: "Já existe um cupom com esse código." },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        type: body.type,
        value: Number(body.value),
        isActive: body.isActive ?? true,
        usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Erro ao criar cupom:", error);

    return NextResponse.json(
      { error: "Erro ao criar cupom." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    if (!body.couponId) {
      return NextResponse.json(
        { error: "ID do cupom não informado." },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.update({
      where: {
        id: body.couponId,
      },
      data: {
        code: body.code ? normalizeCode(body.code) : undefined,
        type: body.type || undefined,
        value: body.value !== undefined ? Number(body.value) : undefined,
        isActive:
          body.isActive === undefined ? undefined : Boolean(body.isActive),
        usageLimit:
          body.usageLimit === "" || body.usageLimit === null
            ? null
            : body.usageLimit !== undefined
            ? Number(body.usageLimit)
            : undefined,
        expiresAt:
          body.expiresAt === "" || body.expiresAt === null
            ? null
            : body.expiresAt
            ? new Date(body.expiresAt)
            : undefined,
      },
    });

    return NextResponse.json(coupon);
  } catch (error) {
    console.error("Erro ao atualizar cupom:", error);

    return NextResponse.json(
      { error: "Erro ao atualizar cupom." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();

    if (!body.couponId) {
      return NextResponse.json(
        { error: "ID do cupom não informado." },
        { status: 400 }
      );
    }

    await prisma.coupon.delete({
      where: {
        id: body.couponId,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Cupom removido com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao remover cupom:", error);

    return NextResponse.json(
      { error: "Erro ao remover cupom." },
      { status: 500 }
    );
  }
}
