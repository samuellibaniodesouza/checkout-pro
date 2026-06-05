import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { getMercadoPagoAccessToken } from "@/app/lib/paymentSettings";
import { sendDownloadEmail } from "@/app/lib/sendDownloadEmail";

type MetaPurchasePayload = {
  pixelId: string;
  orderId: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  productId: string;
  amount: number;
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function sendMetaPurchase({
  pixelId,
  orderId,
  customerEmail,
  customerPhone,
  productName,
  productId,
  amount,
}: MetaPurchasePayload) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const graphVersion = process.env.META_GRAPH_VERSION || "v21.0";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  if (!accessToken || !pixelId) {
    console.log("Meta Pixel não configurado. Purchase não enviado.");
    return {
      skipped: true,
      reason: "META_ACCESS_TOKEN ou pixelId não configurado.",
    };
  }

  const eventTime = Math.floor(Date.now() / 1000);

  const response = await fetch(
    `https://graph.facebook.com/${graphVersion}/${pixelId}/events?access_token=${accessToken}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data: [
          {
            event_name: "Purchase",
            event_time: eventTime,
            event_id: orderId,
            action_source: "website",
            event_source_url: siteUrl,
            user_data: {
              em: [sha256(normalize(customerEmail))],
              ph: customerPhone
                ? [sha256(onlyNumbers(customerPhone))]
                : undefined,
            },
            custom_data: {
              currency: "BRL",
              value: amount,
              content_name: productName,
              content_ids: [productId],
              content_type: "product",
            },
          },
        ],
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro ao enviar Purchase para Meta:", data);
    return {
      ok: false,
      data,
    };
  }

  console.log("Purchase enviado para Meta:", data);

  return {
    ok: true,
    data,
  };
}

function getPaymentIdFromWebhookBody(body: any) {
  return (
    body?.data?.id ||
    body?.id ||
    body?.resource?.split("/").pop() ||
    body?.topic === "payment" && body?.id
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const paymentId = getPaymentIdFromWebhookBody(body);

    if (!paymentId) {
      return NextResponse.json(
        { error: "ID do pagamento não encontrado.", body },
        { status: 400 }
      );
    }

    const accessToken = await getMercadoPagoAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access Token Mercado Pago não configurado." },
        { status: 400 }
      );
    }

    const client = new MercadoPagoConfig({
      accessToken,
    });

    const paymentClient = new Payment(client);

    const payment = await paymentClient.get({
      id: String(paymentId),
    });

    const gatewayPaymentId = String(payment.id);
    const mercadoPagoStatus = payment.status;

    const order = await prisma.order.findFirst({
      where: {
        gatewayPaymentId,
      },
      include: {
        product: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          error: "Pedido não encontrado para este pagamento.",
          gatewayPaymentId,
          mercadoPagoStatus,
        },
        { status: 404 }
      );
    }

    let nextStatus = order.paymentStatus;

    if (mercadoPagoStatus === "approved") {
      nextStatus = "paid";
    }

    if (
      mercadoPagoStatus === "cancelled" ||
      mercadoPagoStatus === "rejected" ||
      mercadoPagoStatus === "refunded" ||
      mercadoPagoStatus === "charged_back"
    ) {
      nextStatus = "cancelled";
    }

    if (mercadoPagoStatus === "pending" || mercadoPagoStatus === "in_process") {
      nextStatus = "pending";
    }

    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        paymentStatus: nextStatus,
      },
      include: {
        product: true,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const downloadUrl = `${siteUrl}/area-de-download/${updatedOrder.id}`;

    let emailResult: unknown = null;
    let metaResult: unknown = null;
    let leadResult: unknown = null;

    if (nextStatus === "paid") {
      if (!updatedOrder.emailSent) {
        emailResult = await sendDownloadEmail({
          to: updatedOrder.customerEmail,
          customerName: updatedOrder.customerName,
          productName: updatedOrder.productName,
          downloadUrl,
        });

        await prisma.order.update({
          where: {
            id: updatedOrder.id,
          },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
          },
        });
      } else {
        emailResult = {
          skipped: true,
          reason: "E-mail de acesso já enviado.",
        };
      }

      if (
        updatedOrder.product?.metaPixelId &&
        !updatedOrder.metaPurchaseSent
      ) {
        metaResult = await sendMetaPurchase({
          pixelId: updatedOrder.product.metaPixelId,
          orderId: updatedOrder.id,
          customerEmail: updatedOrder.customerEmail,
          customerPhone: updatedOrder.customerPhone,
          productName: updatedOrder.productName,
          productId: updatedOrder.productId || updatedOrder.product?.id || "",
          amount: updatedOrder.amount,
        });

        await prisma.order.update({
          where: {
            id: updatedOrder.id,
          },
          data: {
            metaPurchaseSent: true,
            metaPurchaseSentAt: new Date(),
          },
        });
      } else {
        metaResult = {
          skipped: true,
          reason: "Purchase Meta já enviado ou Pixel não configurado.",
        };
      }

      await prisma.lead.updateMany({
        where: {
          customerEmail: updatedOrder.customerEmail,
          status: {
            in: ["abandoned", "contacted"],
          },
        },
        data: {
          status: "converted",
          convertedOrderId: updatedOrder.id,
          notes: "Convertido automaticamente pelo webhook do Mercado Pago.",
        },
      });

      leadResult = {
        ok: true,
        message: "Leads relacionados marcados como convertidos.",
      };
    }

    return NextResponse.json({
      ok: true,
      gatewayPaymentId,
      mercadoPagoStatus,
      previousStatus: order.paymentStatus,
      currentStatus: nextStatus,
      orderId: updatedOrder.id,
      emailResult,
      metaResult,
      leadResult,
    });
  } catch (error) {
    console.error("Erro no webhook do Mercado Pago:", error);

    return NextResponse.json(
      { error: "Erro ao processar webhook Mercado Pago." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Webhook Mercado Pago ativo.",
  });
}
