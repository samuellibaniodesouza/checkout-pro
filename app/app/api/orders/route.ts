import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);

    return NextResponse.json(
      { error: "Erro ao buscar pedidos." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const order = await prisma.order.create({
      data: {
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        customerCpf: body.customerCpf,

        productName: body.productName,
        productId: body.productId || null,

        amount: body.amount,

        paymentMethod: body.paymentMethod,
        paymentStatus: "pending",

        orderBump: body.orderBump ?? false,
        couponCode: body.couponCode || null,
        couponDiscount: Number(body.couponDiscount || 0),

        isUpsellOrder: body.isUpsellOrder ?? false,
        parentOrderId: body.parentOrderId || null,
      },
    });

    if (body.couponCode) {
      const couponCode = String(body.couponCode).trim().toUpperCase();

      await prisma.coupon.updateMany({
        where: {
          code: couponCode,
        },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Erro ao criar pedido:", error);

    return NextResponse.json(
      { error: "Erro ao criar pedido" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    if (!body.orderId) {
      return NextResponse.json(
        { error: "ID do pedido não informado." },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: body.orderId,
      },
      data: {
        gatewayPaymentId: body.gatewayPaymentId,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("Erro ao atualizar pedido:", error);

    return NextResponse.json(
      { error: "Erro ao atualizar pedido" },
      { status: 500 }
    );
  }
}
