"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [viewers, setViewers] = useState(17);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerCpf: "",
    paymentMethod: "PIX",
    orderBump: false,
  });

  const total = form.orderBump ? 29.8 : 19.9;

  useEffect(() => {
    const updateViewers = () => {
      setViewers(Math.floor(Math.random() * 18) + 12);
    };

    updateViewers();

    const interval = setInterval(updateViewers, 5000);

    return () => clearInterval(interval);
  }, []);

  function updateForm(field: string, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const orderResponse = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        customerCpf: form.customerCpf,
        productName: "Ebook Digital Premium",
        amount: total,
        paymentMethod: form.paymentMethod,
        orderBump: form.orderBump,
      }),
    });

    if (!orderResponse.ok) {
      setMessage("Erro ao criar pedido. Verifique os dados.");
      setLoading(false);
      return;
    }

    const orderData = await orderResponse.json();

    if (form.paymentMethod === "PIX") {
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod: form.paymentMethod,
          orderId: orderData.id,
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerCpf: form.customerCpf,
          productName: "Ebook Digital Premium",
          amount: total,
        }),
      });

      if (!paymentResponse.ok) {
        setMessage("Pedido criado, mas houve erro ao gerar o PIX.");
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
          amount: total,
          productName: "Ebook Digital Premium",
        })
      );
    } else {
      setMessage(
        "Cartão selecionado: o backend já está separado e não gera mais QR Code PIX. Falta ligar o formulário seguro de cartão do Mercado Pago para enviar o token do cartão."
      );
      setLoading(false);
      return;
    }

    router.push("/obrigado");
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl bg-white p-6 text-zinc-900 shadow-2xl">
          <div className="mb-6 rounded-2xl bg-green-50 p-4 text-center">
            <p className="text-sm font-bold text-green-700">
              🔒 Checkout seguro e pagamento rápido
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Ebook Digital Premium
            </h1>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                Compra Segura
              </span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                Acesso Imediato
              </span>
              <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-700">
                Garantia de 7 Dias
              </span>
            </div>

            <p className="mt-4 text-zinc-600">
              Preencha seus dados para receber o acesso imediatamente após a confirmação do pagamento.
            </p>
          </div>

          <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500 shadow-lg shadow-green-400"></span>
              </span>

              <p className="text-sm font-black text-green-700">
                🔥 {viewers} pessoas estão visualizando esta oferta agora
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              required
              className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
              placeholder="Nome completo"
              value={form.customerName}
              onChange={(e) => updateForm("customerName", e.target.value)}
            />

            <input
              required
              type="email"
              className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
              placeholder="E-mail"
              value={form.customerEmail}
              onChange={(e) => updateForm("customerEmail", e.target.value)}
            />

            <input
              required
              className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
              placeholder="Telefone"
              value={form.customerPhone}
              onChange={(e) => updateForm("customerPhone", e.target.value)}
            />

            <input
              required
              className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
              placeholder="CPF"
              value={form.customerCpf}
              onChange={(e) => updateForm("customerCpf", e.target.value)}
            />

            <div className="rounded-2xl border border-zinc-200 p-4">
              <p className="mb-3 font-bold">Forma de pagamento</p>
              <select
                className="w-full rounded-xl border border-zinc-300 p-4 outline-none"
                value={form.paymentMethod}
                onChange={(e) => updateForm("paymentMethod", e.target.value)}
              >
                <option value="PIX">PIX — aprovação rápida</option>
                <option value="CARTAO">Cartão de crédito</option>
              </select>

              <p className="mt-2 text-xs text-zinc-500">
                Pagamento processado em ambiente seguro.
              </p>
            </div>

            <label className="flex gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm">
              <input
                type="checkbox"
                checked={form.orderBump}
                onChange={(e) => updateForm("orderBump", e.target.checked)}
              />
              <span>
                <strong>Adicionar order bump</strong>
                <br />
                Receba também um material extra por apenas R$ 9,90.
              </span>
            </label>

            <button
              disabled={loading}
              className="w-full rounded-xl bg-green-600 p-4 text-lg font-black text-white shadow-lg shadow-green-200 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Gerando pagamento..." : "Comprar agora com segurança"}
            </button>

            {message && (
              <p className="rounded-xl bg-red-100 p-3 text-center text-sm font-bold text-red-700">
                {message}
              </p>
            )}

            <p className="text-center text-xs text-zinc-500">
              Seus dados estão protegidos. Não armazenamos dados de cartão.
            </p>
          </form>
        </section>

        <aside className="rounded-3xl bg-zinc-900 p-6 shadow-2xl">
          <p className="text-sm font-bold text-green-400">
            Resumo do pedido
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between border-b border-zinc-800 pb-4">
              <span>Ebook Digital Premium</span>
              <strong>R$ 19,90</strong>
            </div>

            <div className="flex justify-between text-zinc-400">
              <span>Order bump</span>
              <span>{form.orderBump ? "R$ 9,90" : "Opcional"}</span>
            </div>

            <div className="flex justify-between border-t border-zinc-800 pt-4 text-xl">
              <span>Total</span>
              <strong className="text-green-400">
                R$ {total.toFixed(2).replace(".", ",")}
              </strong>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-zinc-800 p-4 text-sm text-zinc-300">
            ✅ Acesso imediato após confirmação.
            <br />
            ✅ Pagamento rápido via PIX.
            <br />
            ✅ Ambiente seguro.
            <br />
            ✅ Garantia de 7 dias.
          </div>

          <div className="mt-6 rounded-2xl border border-green-500/30 bg-green-500/10 p-4">
            <p className="text-sm font-bold text-green-400">
              Compra protegida
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              Você receberá o acesso digital após a confirmação do pagamento.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}