"use client";

import { useEffect, useState } from "react";

type PaymentData = {
  type?: string;
  status?: string;
  statusDetail?: string;
  orderId: string;
  paymentId: string;
  qrCode?: string | null;
  qrCodeBase64?: string | null;
  ticketUrl?: string | null;
  barcode?: string | null;
  amount: number;
  productName: string;
  downloadUrl?: string;
  upsellUrl?: string | null;
  upsellProductName?: string | null;
  upsellProductPrice?: number | null;
  upsellImageUrl?: string | null;
  upsellHeadline?: string | null;
  upsellBenefits?: string | null;
};

function getPaymentTitle(type?: string, status?: string) {
  if (type === "PIX") return "Finalize seu pagamento via PIX";
  if (type === "BOLETO") return "Boleto gerado com sucesso";
  if (type === "CARTAO_CREDITO" || type === "CARTAO_DEBITO") {
    if (status === "approved") return "Pagamento aprovado";
    if (status === "rejected") return "Pagamento recusado";
    return "Pagamento em análise";
  }

  return "Pedido criado com sucesso";
}

function getPaymentDescription(type?: string, status?: string) {
  if (type === "PIX") {
    return "Escaneie o QR Code ou copie o código PIX abaixo para concluir sua compra.";
  }

  if (type === "BOLETO") {
    return "Abra ou copie o boleto abaixo. A liberação acontece após a compensação bancária.";
  }

  if (type === "CARTAO_CREDITO" || type === "CARTAO_DEBITO") {
    if (status === "approved") {
      return "Seu pagamento foi aprovado. O webhook também vai confirmar o pedido e liberar o acesso automático.";
    }

    if (status === "rejected") {
      return "O Mercado Pago recusou esse pagamento. Tente outro cartão ou volte e escolha PIX.";
    }

    return "O Mercado Pago recebeu o pagamento e está processando a resposta final.";
  }

  return "Acompanhe abaixo as informações do seu pedido.";
}

export default function ObrigadoPage() {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const savedPayment =
      localStorage.getItem("checkoutPayment") || localStorage.getItem("checkoutPix");

    if (savedPayment) {
      setPaymentData(JSON.parse(savedPayment));
    }
  }, []);

  async function copyText(value?: string | null) {
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2500);
  }

  const benefits =
    paymentData?.upsellBenefits
      ?.split("\n")
      .map((item) => item.trim())
      .filter(Boolean) || [];

  const isCard =
    paymentData?.type === "CARTAO_CREDITO" ||
    paymentData?.type === "CARTAO_DEBITO";

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
        <section className="w-full rounded-3xl bg-white p-6 text-center text-zinc-900 shadow-2xl">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <span className="text-4xl">✅</span>
          </div>

          <p className="text-sm font-bold text-green-700">Pedido criado com sucesso</p>

          <h1 className="mt-3 text-3xl font-black">
            {getPaymentTitle(paymentData?.type, paymentData?.status)}
          </h1>

          <p className="mt-4 text-zinc-600">
            {getPaymentDescription(paymentData?.type, paymentData?.status)}
          </p>

          {paymentData ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl bg-zinc-100 p-4">
                <p className="text-sm font-bold text-zinc-600">Produto</p>
                <p className="mt-1 font-black">{paymentData.productName}</p>

                <p className="mt-3 text-sm font-bold text-zinc-600">Valor</p>
                <p className="mt-1 text-2xl font-black text-green-600">
                  R$ {paymentData.amount.toFixed(2).replace(".", ",")}
                </p>

                <p className="mt-3 text-xs text-zinc-500">Pedido: {paymentData.orderId}</p>
                {paymentData.status && (
                  <p className="mt-1 text-xs font-bold text-zinc-600">
                    Status Mercado Pago: {paymentData.status}
                    {paymentData.statusDetail ? ` / ${paymentData.statusDetail}` : ""}
                  </p>
                )}
              </div>

              {paymentData.qrCodeBase64 && (
                <div className="rounded-2xl border border-zinc-200 p-4">
                  <img
                    src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="mx-auto h-64 w-64 rounded-xl"
                  />
                </div>
              )}

              {paymentData.qrCode && (
                <div className="rounded-2xl bg-zinc-100 p-4 text-left">
                  <p className="mb-2 text-sm font-bold text-zinc-700">PIX copia e cola</p>

                  <textarea
                    readOnly
                    value={paymentData.qrCode}
                    className="h-28 w-full resize-none rounded-xl border border-zinc-300 bg-white p-3 text-xs text-zinc-700 outline-none"
                  />

                  <button
                    onClick={() => copyText(paymentData.qrCode)}
                    className="mt-3 w-full rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700"
                  >
                    {copied ? "Código copiado!" : "Copiar código PIX"}
                  </button>
                </div>
              )}

              {paymentData.barcode && (
                <div className="rounded-2xl bg-zinc-100 p-4 text-left">
                  <p className="mb-2 text-sm font-bold text-zinc-700">Código do boleto</p>
                  <textarea
                    readOnly
                    value={paymentData.barcode}
                    className="h-20 w-full resize-none rounded-xl border border-zinc-300 bg-white p-3 text-xs text-zinc-700 outline-none"
                  />
                  <button
                    onClick={() => copyText(paymentData.barcode)}
                    className="mt-3 w-full rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700"
                  >
                    {copied ? "Código copiado!" : "Copiar código do boleto"}
                  </button>
                </div>
              )}

              {paymentData.ticketUrl && (
                <a
                  href={paymentData.ticketUrl}
                  target="_blank"
                  className="block rounded-xl border border-zinc-300 p-4 font-bold text-zinc-700 hover:bg-zinc-100"
                >
                  Abrir pagamento no Mercado Pago
                </a>
              )}

              {isCard && paymentData.status === "approved" && paymentData.downloadUrl && (
                <a
                  href={paymentData.downloadUrl}
                  className="block rounded-xl bg-zinc-900 p-4 font-black text-white hover:bg-zinc-800"
                >
                  Acessar área de download
                </a>
              )}

              {paymentData.upsellUrl && paymentData.type === "PIX" && (
                <div className="rounded-3xl border-2 border-purple-300 bg-purple-50 p-5">
                  <p className="text-sm font-black text-purple-700">🎁 Oferta especial liberada</p>

                  {paymentData.upsellImageUrl && (
                    <img
                      src={paymentData.upsellImageUrl}
                      alt={paymentData.upsellProductName || "Oferta Especial"}
                      className="mt-4 max-h-72 w-full rounded-2xl bg-black object-contain"
                    />
                  )}

                  <h2 className="mt-5 text-2xl font-black text-purple-950">Aproveite também:</h2>
                  <p className="mt-2 text-lg font-black text-purple-900">{paymentData.upsellProductName}</p>

                  {typeof paymentData.upsellProductPrice === "number" && (
                    <p className="mt-2 text-2xl font-black text-green-600">
                      R$ {paymentData.upsellProductPrice.toFixed(2).replace(".", ",")}
                    </p>
                  )}

                  {paymentData.upsellHeadline && (
                    <p className="mx-auto mt-3 max-w-xl text-sm font-bold leading-relaxed text-purple-800">
                      {paymentData.upsellHeadline}
                    </p>
                  )}

                  {benefits.length > 0 && (
                    <div className="mt-5 rounded-2xl bg-white p-4 text-left shadow-sm">
                      <p className="mb-3 text-center text-sm font-black text-purple-950">
                        O que você vai receber:
                      </p>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {benefits.map((benefit, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 rounded-xl bg-purple-50 p-3 text-sm font-bold text-purple-950"
                          >
                            <span className="mt-0.5 text-green-600">✅</span>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <a
                    href={paymentData.upsellUrl}
                    className="mt-5 block rounded-xl bg-purple-700 p-4 font-black text-white hover:bg-purple-800"
                  >
                    Sim, quero ver essa oferta
                  </a>
                </div>
              )}

              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                Seus arquivos só serão liberados automaticamente após a confirmação do pagamento pelo webhook.
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-700">
              Nenhum pagamento encontrado. Volte ao checkout e gere um novo pedido.
            </div>
          )}

          <a href="/" className="mt-6 block rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700">
            Voltar ao checkout principal
          </a>
        </section>
      </div>
    </main>
  );
}
