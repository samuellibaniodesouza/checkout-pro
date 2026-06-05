"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  slug: string;
};

type Order = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCpf: string;
  productName: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  gatewayPaymentId: string | null;
  emailSent?: boolean;
  emailSentAt?: string | null;
  createdAt: string;
  product: Product | null;
};

export default function PedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState("");
  const [message, setMessage] = useState("");

  async function loadOrders() {
    const response = await fetch("/api/orders");
    const data = await response.json();

    setOrders(data);
    setLoading(false);
  }

  async function sendAccessEmail(orderId: string) {
    setSendingId(orderId);
    setMessage("");

    const response = await fetch("/api/orders/send-access-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("E-mail de acesso enviado com sucesso.");
      await loadOrders();
    } else {
      setMessage(data.error || "Erro ao enviar e-mail.");
    }

    setSendingId("");
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const totalSales = orders.reduce((sum, order) => {
    if (order.paymentStatus === "paid") return sum + order.amount;
    return sum;
  }, 0);

  const pendingOrders = orders.filter(
    (order) => order.paymentStatus === "pending"
  ).length;

  const paidOrders = orders.filter(
    (order) => order.paymentStatus === "paid"
  ).length;

  function getStatusLabel(status: string) {
    if (status === "paid") return "Pago";
    if (status === "cancelled") return "Cancelado";
    return "Pendente";
  }

  function getStatusClass(status: string) {
    if (status === "paid") {
      return "rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400";
    }

    if (status === "cancelled") {
      return "rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400";
    }

    return "rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-bold text-yellow-400";
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-sm font-bold text-green-400">
            Painel administrativo
          </p>

          <h1 className="mt-2 text-3xl font-black">Pedidos e vendas</h1>

          <p className="mt-2 text-zinc-400">
            Acompanhe os pedidos, pagamentos e envio dos acessos.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Vendas pagas</p>
            <strong className="mt-2 block text-3xl text-green-400">
              {paidOrders}
            </strong>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Pendentes</p>
            <strong className="mt-2 block text-3xl text-yellow-400">
              {pendingOrders}
            </strong>
          </div>

          <div className="rounded-2xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Faturamento confirmado</p>
            <strong className="mt-2 block text-3xl text-green-400">
              R$ {totalSales.toFixed(2).replace(".", ",")}
            </strong>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl bg-zinc-900 p-4 text-sm font-bold text-green-400">
            {message}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-zinc-800 text-zinc-300">
                <tr>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Pagamento</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Acesso</th>
                  <th className="p-4">Ações</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td className="p-6 text-center text-zinc-400" colSpan={8}>
                      Carregando pedidos...
                    </td>
                  </tr>
                )}

                {!loading &&
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-zinc-800 text-zinc-300"
                    >
                      <td className="p-4">
                        <p className="font-bold text-white">
                          {order.customerName}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {order.product?.name || order.productName}
                        </p>
                      </td>

                      <td className="p-4">
                        <p>{order.customerEmail}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {order.customerPhone}
                        </p>
                      </td>

                      <td className="p-4 font-bold text-white">
                        R$ {order.amount.toFixed(2).replace(".", ",")}
                      </td>

                      <td className="p-4">
                        <span className={getStatusClass(order.paymentStatus)}>
                          {getStatusLabel(order.paymentStatus)}
                        </span>
                      </td>

                      <td className="p-4">
                        <p className="font-bold">{order.paymentMethod}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {order.gatewayPaymentId || "Sem ID"}
                        </p>
                      </td>

                      <td className="p-4">
                        {new Date(order.createdAt).toLocaleString("pt-BR")}
                      </td>

                      <td className="p-4">
                        {order.emailSent ? (
                          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400">
                            Enviado
                          </span>
                        ) : (
                          <span className="rounded-full bg-zinc-700 px-3 py-1 text-xs font-bold text-zinc-300">
                            Não enviado
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="grid min-w-[150px] gap-2">
                          <a
                            href={`/area-de-download/${order.id}`}
                            className="rounded-xl bg-green-600 px-3 py-2 text-center text-xs font-black text-white hover:bg-green-700"
                          >
                            Download
                          </a>

                          {order.product && (
                            <a
                              href={`/checkout/${order.product.slug}`}
                              className="rounded-xl bg-zinc-700 px-3 py-2 text-center text-xs font-black text-white hover:bg-zinc-600"
                            >
                              Checkout
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => sendAccessEmail(order.id)}
                            disabled={sendingId === order.id}
                            className="rounded-xl bg-blue-600 px-3 py-2 text-center text-xs font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {sendingId === order.id
                              ? "Enviando..."
                              : "Enviar acesso"}
                          </button>

                          <a
                            href={`mailto:${order.customerEmail}`}
                            className="rounded-xl bg-zinc-800 px-3 py-2 text-center text-xs font-black text-white hover:bg-zinc-700"
                          >
                            E-mail
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && orders.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-zinc-400" colSpan={8}>
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <a
            href="/painel"
            className="rounded-xl bg-zinc-800 px-5 py-3 font-bold text-white hover:bg-zinc-700"
          >
            Dashboard
          </a>

          <a
            href="/painel/produtos"
            className="rounded-xl bg-green-600 px-5 py-3 font-black text-white hover:bg-green-700"
          >
            Produtos
          </a>
        </div>
      </div>
    </main>
  );
}
