import { NextResponse } from "next/server";
import { getPaymentSettings } from "@/app/lib/paymentSettings";

export async function GET() {
  try {
    const settings = await getPaymentSettings();

    const publicKey =
      settings.mercadoPagoPublicKey ||
      process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY ||
      process.env.MERCADO_PAGO_PUBLIC_KEY ||
      "";

    if (!publicKey) {
      return NextResponse.json(
        {
          error:
            "Public Key do Mercado Pago não configurada. Configure em /painel/pagamentos.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ publicKey });
  } catch (error) {
    console.error("Erro ao buscar Public Key Mercado Pago:", error);

    return NextResponse.json(
      { error: "Erro ao buscar Public Key Mercado Pago." },
      { status: 500 }
    );
  }
}
