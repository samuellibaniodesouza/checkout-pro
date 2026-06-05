import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { getMercadoPagoAccessToken } from "@/app/lib/paymentSettings";

function onlyNumbers(value: unknown) {
  return String(value || "").replace(/\D/g, "");
}

function normalizePaymentMethod(value: unknown) {
  const method = String(value || "PIX").trim().toUpperCase();

  if (["PIX", "P IX"].includes(method)) return "PIX";

  if (
    [
      "CARTAO",
      "CARTÃO",
      "CARD",
      "CREDIT_CARD",
      "CREDITO",
      "CRÉDITO",
      "CARTAO_CREDITO",
      "CARTÃO_CRÉDITO",
    ].includes(method)
  ) {
    return "CARTAO_CREDITO";
  }

  if (
    [
      "DEBIT_CARD",
      "DEBITO",
      "DÉBITO",
      "CARTAO_DEBITO",
      "CARTÃO_DÉBITO",
    ].includes(method)
  ) {
    return "CARTAO_DEBITO";
  }

  if (["BOLETO", "BANK_SLIP", "TICKET"].includes(method)) return "BOLETO";

  return method;
}

function splitName(fullName: unknown) {
  const parts = String(fullName || "Cliente").trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift() || "Cliente";
  const lastName = parts.join(" ") || "Digital";

  return { firstName, lastName };
}

function getMercadoPagoErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      message?: string;
      cause?: Array<{ description?: string; message?: string; code?: string }>;
      error?: string;
    };

    const causeMessage = maybeError.cause
      ?.map((item) => item.description || item.message || item.code)
      .filter(Boolean)
      .join(" | ");

    return causeMessage || maybeError.message || maybeError.error || "Erro desconhecido.";
  }

  return "Erro desconhecido.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const accessToken = await getMercadoPagoAccessToken();

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            "Access Token do Mercado Pago não configurado. Configure em /painel/pagamentos.",
        },
        { status: 400 }
      );
    }

    const amount = Number(body.amount || 0);
    const customerCpf = onlyNumbers(body.customerCpf);
    const paymentMethod = normalizePaymentMethod(body.paymentMethod);
    const { firstName, lastName } = splitName(body.customerName);

    if (!body.customerEmail || !customerCpf || !body.productName || amount <= 0) {
      return NextResponse.json(
        { error: "Dados inválidos para gerar pagamento." },
        { status: 400 }
      );
    }

    const client = new MercadoPagoConfig({ accessToken });
    const paymentClient = new Payment(client);

    const basePayment = {
      transaction_amount: amount,
      description: body.productName,
      external_reference: body.orderId ? String(body.orderId) : undefined,
      payer: {
        email: body.customerEmail,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: "CPF",
          number: customerCpf,
        },
      },
    };

    if (paymentMethod === "PIX") {
      const payment = await paymentClient.create({
        body: {
          ...basePayment,
          payment_method_id: "pix",
        } as any,
      });

      return NextResponse.json({
        type: "PIX",
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        qrCode: payment.point_of_interaction?.transaction_data?.qr_code || null,
        qrCodeBase64:
          payment.point_of_interaction?.transaction_data?.qr_code_base64 || null,
        ticketUrl:
          payment.point_of_interaction?.transaction_data?.ticket_url || null,
      });
    }

    if (paymentMethod === "BOLETO") {
      const zipCode = onlyNumbers(body.address?.zipCode);
      const streetName = String(body.address?.streetName || "").trim();
      const streetNumber = String(body.address?.streetNumber || "").trim();
      const neighborhood = String(body.address?.neighborhood || "").trim();
      const city = String(body.address?.city || "").trim();
      const federalUnit = String(body.address?.federalUnit || "").trim().toUpperCase();

      if (!zipCode || !streetName || !streetNumber || !neighborhood || !city || !federalUnit) {
        return NextResponse.json(
          {
            error:
              "Boleto precisa de endereço completo: CEP, rua, número, bairro, cidade e UF.",
          },
          { status: 400 }
        );
      }

      const payment = await paymentClient.create({
        body: {
          ...basePayment,
          payment_method_id: "bolbradesco",
          payer: {
            ...basePayment.payer,
            address: {
              zip_code: zipCode,
              street_name: streetName,
              street_number: streetNumber,
              neighborhood,
              city,
              federal_unit: federalUnit,
            },
          },
        } as any,
      });

      return NextResponse.json({
        type: "BOLETO",
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
        ticketUrl:
          payment.transaction_details?.external_resource_url ||
          payment.point_of_interaction?.transaction_data?.ticket_url ||
          null,
        barcode: (payment as any).barcode?.content || null,
        dateOfExpiration: (payment as any).date_of_expiration || null,
      });
    }

    if (["CARTAO_CREDITO", "CARTAO_DEBITO"].includes(paymentMethod)) {
      if (!body.cardToken || !body.cardPaymentMethodId) {
        return NextResponse.json(
          {
            error:
              "Pagamento por cartão precisa do token seguro do Mercado Pago e da bandeira/meio de pagamento.",
          },
          { status: 400 }
        );
      }

      const installments = paymentMethod === "CARTAO_DEBITO" ? 1 : Number(body.installments || 1);

      const payment = await paymentClient.create({
        body: {
          ...basePayment,
          token: String(body.cardToken),
          installments,
          payment_method_id: String(body.cardPaymentMethodId),
          issuer_id: body.issuerId ? String(body.issuerId) : undefined,
        } as any,
      });

      return NextResponse.json({
        type: paymentMethod,
        id: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
      });
    }

    return NextResponse.json(
      { error: "Forma de pagamento inválida." },
      { status: 400 }
    );
  } catch (error) {
    const details = getMercadoPagoErrorMessage(error);

    console.error("Erro ao criar pagamento Mercado Pago:", error);

    return NextResponse.json(
      {
        error: "Erro ao criar pagamento no Mercado Pago.",
        details,
      },
      { status: 500 }
    );
  }
}
