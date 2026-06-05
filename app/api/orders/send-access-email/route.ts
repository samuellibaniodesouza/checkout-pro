import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { sendDownloadEmail } from "@/app/lib/sendDownloadEmail";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.orderId) {
      return NextResponse.json(
        { error: "ID do pedido não informado." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: {
        id: body.orderId,
      },
      include: {
        product: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    if (!order.product) {
      return NextResponse.json(
        { error: "Pedido sem produto vinculado." },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const downloadUrl = `${siteUrl}/area-de-download/${order.id}`;

    const emailResult = await sendDownloadEmail({
      to: order.customerEmail,
      customerName: order.customerName,
      productName: order.product.name,
      downloadUrl,
    });

    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        emailSent: true,
        emailSentAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "E-mail de acesso enviado.",
      emailResult,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de acesso:", error);

    return NextResponse.json(
      { error: "Erro ao enviar e-mail de acesso." },
      { status: 500 }
    );
  }
}
