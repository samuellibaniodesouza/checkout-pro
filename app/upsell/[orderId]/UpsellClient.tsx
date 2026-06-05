"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ParentOrder = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpf: string;
  productName: string;
};

type UpsellProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
};

type UpsellClientProps = {
  parentOrder: ParentOrder;
  upsellProduct: UpsellProduct;
};

export default function UpsellClient({
  parentOrder,
  upsellProduct,
}: UpsellClientProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function acceptUpsell() {
    setLoading(true);
    setMessage("");

    const orderResponse = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName: parentOrder.customerName,
        customerEmail: parentOrder.customerEmail,
        customerPhone: parentOrder.customerPhone,
        customerCpf: parentOrder.customerCpf,
        productId: upsellProduct.id,
        productName: upsellProduct.name,
        amount: upsellProduct.price,
        paymentMethod: "PIX",
        orderBump: false,
        isUpsellOrder: true,
        parentOrderId: parentOrder.id,
      }),
    });

    if (!orderResponse.ok) {
      setMessage("Erro ao criar pedido do upsell.");
      setLoading(false);
      return;
    }

    const orderData = await orderResponse.json();

    const paymentResponse = await fetch("/api/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentMethod: "PIX",
        orderId: orderData.id,
        customerName: parentOrder.customerName,
        customerEmail: parentOrder.customerEmail,
        customerCpf: parentOrder.customerCpf,
        productName: upsellProduct.name,
        amount: upsellProduct.price,
      }),
    });

    if (!paymentResponse.ok) {
      setMessage("Pedido criado, mas houve erro ao gerar o PIX do upsell.");
      setLoading(false);
      return;
    }

    const paymentData = await paymentResponse.json();

    await fetch("/api/orders", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId: orderData.id,
        gatewayPaymentId: String(paymentData.id),
      }),
    });

    localStorage.setItem(
      "checkoutPix",
      JSON.stringify({
        orderId: orderData.id,
        paymentId: paymentData.id,
        qrCode: paymentData.qrCode,
        qrCodeBase64: paymentData.qrCodeBase64,
        ticketUrl: paymentData.ticketUrl,
        amount: upsellProduct.price,
        productName: upsellProduct.name,
        downloadUrl: `/area-de-download/${orderData.id}`,
        upsellUrl: null,
      })
    );

    router.push("/obrigado");
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-3xl bg-white p-6 text-zinc-900 shadow-2xl">
          <div className="rounded-3xl border-2 border-purple-200 bg-purple-50 p-5 text-center">
            <p className="text-sm font-black text-purple-700">
              🎁 Oferta especial
            </p>

            <h1 className="mt-3 text-3xl font-black text-purple-950">
              Complemente sua compra
            </h1>

            <p className="mt-3 text-purple-800">
              Você acabou de adquirir <strong>{parentOrder.productName}</strong>.
              Aproveite essa oferta complementar.
            </p>
          </div>

          {upsellProduct.imageUrl ? (
            <img
              src={upsellProduct.imageUrl}
              alt={upsellProduct.name}
              className="mt-6 h-72 w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="mt-6 flex h-72 w-full items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
              Sem capa cadastrada
            </div>
          )}

          <h2 className="mt-6 text-3xl font-black">
            {upsellProduct.name}
          </h2>

          <p className="mt-4 text-zinc-600">
            {upsellProduct.description ||
              "Produto complementar recomendado para melhorar seu resultado."}
          </p>

          {message && (
            <p className="mt-5 rounded-xl bg-red-100 p-3 text-center text-sm font-bold text-red-700">
              {message}
            </p>
          )}
        </section>

        <aside className="rounded-3xl bg-zinc-900 p-6 shadow-2xl">
          <p className="text-sm font-bold text-purple-300">
            Oferta exclusiva
          </p>

          <div className="mt-6 rounded-3xl bg-zinc-800 p-5">
            <p className="text-zinc-400">Leve agora por apenas</p>

            <p className="mt-2 text-4xl font-black text-green-400">
              R$ {upsellProduct.price.toFixed(2).replace(".", ",")}
            </p>

            <p className="mt-3 text-sm text-zinc-400">
              Será gerado um novo PIX separado para essa oferta.
            </p>
          </div>

          <button
            onClick={acceptUpsell}
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-purple-700 p-4 text-lg font-black text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Gerando PIX..." : "Sim, quero aproveitar"}
          </button>

          <a
            href="/obrigado"
            className="mt-3 block rounded-xl bg-zinc-800 p-4 text-center font-bold text-white hover:bg-zinc-700"
          >
            Não, obrigado
          </a>

          <div className="mt-6 rounded-2xl bg-zinc-800 p-4 text-sm text-zinc-300">
            ✅ Oferta complementar.
            <br />
            ✅ Pedido separado.
            <br />
            ✅ PIX separado.
            <br />
            ✅ Download liberado após pagamento.
          </div>
        </aside>
      </div>
    </main>
  );
}
