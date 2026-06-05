import { prisma } from "@/app/lib/prisma";

export async function getPaymentSettings() {
  const settings = await prisma.paymentSettings.upsert({
    where: {
      id: "default",
    },
    update: {},
    create: {
      id: "default",
      provider: "mercado_pago",
      environment: "test",
      mercadoPagoAccessToken: "",
      mercadoPagoPublicKey: "",
      mercadoPagoAccountEmail: "",
      receiverName: "",
      manualPixEnabled: false,
      manualPixKey: "",
      manualPixKeyType: "email",
      manualPixReceiverName: "",
      manualPixBankName: "",
    },
  });

  return settings;
}

export async function getMercadoPagoAccessToken() {
  const settings = await getPaymentSettings();

  return (
    settings.mercadoPagoAccessToken ||
    process.env.MERCADO_PAGO_ACCESS_TOKEN ||
    ""
  );
}

export async function getPaymentModeLabel() {
  const settings = await getPaymentSettings();

  return settings.environment === "production" ? "Produção" : "Teste";
}
