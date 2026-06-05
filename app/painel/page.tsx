import { prisma } from "@/app/lib/prisma";

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0,0%";
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function isSameDay(date: Date, reference: Date) {
  return (
    date.getDate() === reference.getDate() &&
    date.getMonth() === reference.getMonth() &&
    date.getFullYear() === reference.getFullYear()
  );
}

function isSameMonth(date: Date, reference: Date) {
  return (
    date.getMonth() === reference.getMonth() &&
    date.getFullYear() === reference.getFullYear()
  );
}

export default async function PainelPage() {
  const [orders, products, expenses, leads, coupons] = await Promise.all([
    prisma.order.findMany({
      include: {
        product: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.product.findMany({
      include: {
        files: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.expense.findMany({
      orderBy: {
        expenseDate: "desc",
      },
    }),
    prisma.lead.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.coupon.findMany({
      orderBy: {
        usedCount: "desc",
      },
    }),
  ]);

  const now = new Date();

  const paidOrders = orders.filter((order) => order.paymentStatus === "paid");
  const pendingOrders = orders.filter(
    (order) => order.paymentStatus === "pending"
  );

  const todayPaidOrders = paidOrders.filter((order) =>
    isSameDay(new Date(order.createdAt), now)
  );

  const monthPaidOrders = paidOrders.filter((order) =>
    isSameMonth(new Date(order.createdAt), now)
  );

  const todayRevenue = todayPaidOrders.reduce(
    (sum, order) => sum + order.amount,
    0
  );

  const monthRevenue = monthPaidOrders.reduce(
    (sum, order) => sum + order.amount,
    0
  );

  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.amount, 0);

  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const profit = totalRevenue - totalExpenses;
  const roi = totalExpenses > 0 ? (profit / totalExpenses) * 100 : 0;
  const cpa = paidOrders.length > 0 ? totalExpenses / paidOrders.length : 0;
  const averageTicket =
    paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

  const upsellOrders = paidOrders.filter((order) => order.isUpsellOrder);
  const upsellRevenue = upsellOrders.reduce(
    (sum, order) => sum + order.amount,
    0
  );

  const bumpOrders = paidOrders.filter((order) => order.orderBump);
  const bumpRevenue = bumpOrders.length * 9.9;

  const todayLeads = leads.filter((lead) =>
    isSameDay(new Date(lead.createdAt), now)
  );

  const abandonedLeads = leads.filter((lead) => lead.status === "abandoned");
  const contactedLeads = leads.filter((lead) => lead.status === "contacted");
  const convertedLeads = leads.filter((lead) => lead.status === "converted");

  const paidOrdersWithCoupon = paidOrders.filter((order) => order.couponCode);
  const couponRevenue = paidOrdersWithCoupon.reduce(
    (sum, order) => sum + order.amount,
    0
  );
  const couponDiscountTotal = paidOrdersWithCoupon.reduce(
    (sum, order) => sum + Number(order.couponDiscount || 0),
    0
  );

  const couponChampion =
    [...coupons].sort((a, b) => b.usedCount - a.usedCount)[0] || null;

  const approvalRate =
    orders.length > 0 ? (paidOrders.length / orders.length) * 100 : 0;

  const productSales = new Map<string, { name: string; sales: number; revenue: number }>();

  paidOrders.forEach((order) => {
    const productName = order.product?.name || order.productName || "Produto";
    const current = productSales.get(productName) || {
      name: productName,
      sales: 0,
      revenue: 0,
    };

    current.sales += 1;
    current.revenue += order.amount;

    productSales.set(productName, current);
  });

  const bestProduct =
    Array.from(productSales.values()).sort((a, b) => b.sales - a.sales)[0] ||
    null;

  const recentOrders = orders.slice(0, 6);
  const recentLeads = leads.slice(0, 5);

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-green-400">
              Painel administrativo
            </p>

            <h1 className="mt-2 text-3xl font-black lg:text-4xl">
              Dashboard executivo
            </h1>

            <p className="mt-2 max-w-2xl text-zinc-400">
              Visão rápida de vendas, lucro, leads, upsell, order bump e
              desempenho geral do checkout.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/logout"
              className="rounded-xl bg-red-700 px-5 py-3 font-black text-white hover:bg-red-800"
            >
              Sair
            </a>
            <a
              href="/painel/produtos"
              className="rounded-xl bg-zinc-800 px-5 py-3 font-bold text-white hover:bg-zinc-700"
            >
              Produtos
            </a>

            <a
              href="/painel/pedidos"
              className="rounded-xl bg-green-600 px-5 py-3 font-black text-white hover:bg-green-700"
            >
              Pedidos
            </a>

            <a
              href="/painel/financeiro"
              className="rounded-xl bg-zinc-800 px-5 py-3 font-bold text-white hover:bg-zinc-700"
            >
              Financeiro
            </a>

            <a
              href="/painel/leads"
              className="rounded-xl bg-yellow-600 px-5 py-3 font-black text-white hover:bg-yellow-700"
            >
              Leads
            </a>

            <a
              href="/painel/configuracoes"
              className="rounded-xl bg-purple-700 px-5 py-3 font-black text-white hover:bg-purple-800"
            >
              Configurações
            </a>

            <a
              href="/painel/cupons"
              className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800"
            >
              Cupons
            </a>

            <a
              href="/painel/emails"
              className="rounded-xl bg-zinc-800 px-5 py-3 font-bold text-white hover:bg-zinc-700"
            >
              E-mails
            </a>

            <a
              href="/painel/pagamentos"
              className="rounded-xl bg-green-700 px-5 py-3 font-black text-white hover:bg-green-800"
            >
              Pagamentos
            </a>

            <a
              href="/painel/integracoes"
              className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800"
            >
              Integrações
            </a>

            <a
              href="/painel/sistema"
              className="rounded-xl bg-red-700 px-5 py-3 font-black text-white hover:bg-red-800"
            >
              Sistema
            </a>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-gradient-to-br from-green-500/20 to-zinc-900 p-5 shadow-xl">
            <p className="text-sm text-zinc-300">Faturamento hoje</p>
            <strong className="mt-2 block text-3xl text-green-400">
              {formatCurrency(todayRevenue)}
            </strong>
            <p className="mt-2 text-xs text-zinc-500">
              {todayPaidOrders.length} venda(s) aprovada(s)
            </p>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5 shadow-xl">
            <p className="text-sm text-zinc-400">Faturamento do mês</p>
            <strong className="mt-2 block text-3xl text-green-400">
              {formatCurrency(monthRevenue)}
            </strong>
            <p className="mt-2 text-xs text-zinc-500">
              {monthPaidOrders.length} venda(s) no mês
            </p>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5 shadow-xl">
            <p className="text-sm text-zinc-400">Lucro líquido</p>
            <strong
              className={
                profit >= 0
                  ? "mt-2 block text-3xl text-green-400"
                  : "mt-2 block text-3xl text-red-400"
              }
            >
              {formatCurrency(profit)}
            </strong>
            <p className="mt-2 text-xs text-zinc-500">
              Receita total menos gastos cadastrados
            </p>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5 shadow-xl">
            <p className="text-sm text-zinc-400">ROI geral</p>
            <strong
              className={
                roi >= 0
                  ? "mt-2 block text-3xl text-green-400"
                  : "mt-2 block text-3xl text-red-400"
              }
            >
              {formatPercent(roi)}
            </strong>
            <p className="mt-2 text-xs text-zinc-500">
              CPA: {formatCurrency(cpa)}
            </p>
          </div>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Pedidos pagos</p>
            <strong className="mt-2 block text-3xl text-green-400">
              {paidOrders.length}
            </strong>
            <p className="mt-2 text-xs text-zinc-500">
              Pendentes: {pendingOrders.length}
            </p>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Taxa de aprovação</p>
            <strong className="mt-2 block text-3xl text-green-400">
              {formatPercent(approvalRate)}
            </strong>
            <p className="mt-2 text-xs text-zinc-500">
              Baseada em todos os pedidos
            </p>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Ticket médio</p>
            <strong className="mt-2 block text-3xl text-white">
              {formatCurrency(averageTicket)}
            </strong>
            <p className="mt-2 text-xs text-zinc-500">
              Média dos pedidos pagos
            </p>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Produtos ativos</p>
            <strong className="mt-2 block text-3xl text-white">
              {products.filter((product) => product.isActive).length}
            </strong>
            <p className="mt-2 text-xs text-zinc-500">
              Total cadastrado: {products.length}
            </p>
          </div>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-purple-500/10 p-5">
            <p className="text-sm text-purple-200">Receita de upsell</p>
            <strong className="mt-2 block text-3xl text-purple-300">
              {formatCurrency(upsellRevenue)}
            </strong>
            <p className="mt-2 text-xs text-purple-200/70">
              {upsellOrders.length} pedido(s) de upsell
            </p>
          </div>

          <div className="rounded-3xl bg-green-500/10 p-5">
            <p className="text-sm text-green-200">Estimativa de order bump</p>
            <strong className="mt-2 block text-3xl text-green-300">
              {formatCurrency(bumpRevenue)}
            </strong>
            <p className="mt-2 text-xs text-green-200/70">
              {bumpOrders.length} pedido(s) com bump
            </p>
          </div>

          <div className="rounded-3xl bg-yellow-500/10 p-5">
            <p className="text-sm text-yellow-200">Leads hoje</p>
            <strong className="mt-2 block text-3xl text-yellow-300">
              {todayLeads.length}
            </strong>
            <p className="mt-2 text-xs text-yellow-200/70">
              Abandonados: {abandonedLeads.length}
            </p>
          </div>

          <div className="rounded-3xl bg-blue-500/10 p-5">
            <p className="text-sm text-blue-200">Leads recuperados</p>
            <strong className="mt-2 block text-3xl text-blue-300">
              {convertedLeads.length}
            </strong>
            <p className="mt-2 text-xs text-blue-200/70">
              Contatados: {contactedLeads.length}
            </p>
          </div>

          <div className="rounded-3xl bg-blue-500/10 p-5">
            <p className="text-sm text-blue-200">Vendas com cupom</p>
            <strong className="mt-2 block text-3xl text-blue-300">
              {paidOrdersWithCoupon.length}
            </strong>
            <p className="mt-2 text-xs text-blue-200/70">
              Receita: {formatCurrency(couponRevenue)}
            </p>
          </div>

          <div className="rounded-3xl bg-red-500/10 p-5">
            <p className="text-sm text-red-200">Descontos concedidos</p>
            <strong className="mt-2 block text-3xl text-red-300">
              {formatCurrency(couponDiscountTotal)}
            </strong>
            <p className="mt-2 text-xs text-red-200/70">
              Cupom campeão: {couponChampion?.code || "-"}
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl">
            <p className="text-sm font-bold text-green-700">
              Produto destaque
            </p>

            {bestProduct ? (
              <>
                <h2 className="mt-2 text-2xl font-black">
                  🏆 {bestProduct.name}
                </h2>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-zinc-100 p-4">
                    <p className="text-sm font-bold text-zinc-500">Vendas</p>
                    <strong className="mt-1 block text-3xl text-zinc-950">
                      {bestProduct.sales}
                    </strong>
                  </div>

                  <div className="rounded-2xl bg-zinc-100 p-4">
                    <p className="text-sm font-bold text-zinc-500">Receita</p>
                    <strong className="mt-1 block text-3xl text-green-600">
                      {formatCurrency(bestProduct.revenue)}
                    </strong>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-2xl bg-zinc-100 p-4 text-zinc-600">
                Ainda não há produto campeão.
              </div>
            )}

            <div className="mt-5 grid gap-3">
              <a
                href="/painel/produtos/criar"
                className="rounded-2xl bg-green-600 p-4 text-center font-black text-white hover:bg-green-700"
              >
                + Criar novo produto
              </a>

              <a
                href="/painel/financeiro"
                className="rounded-2xl bg-zinc-900 p-4 text-center font-black text-white hover:bg-zinc-800"
              >
                Ver financeiro completo
              </a>
            </div>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-green-400">
                  Atividade recente
                </p>
                <h2 className="mt-1 text-2xl font-black">Últimos pedidos</h2>
              </div>

              <a
                href="/painel/pedidos"
                className="text-sm font-bold text-green-400 hover:text-green-300"
              >
                Ver todos
              </a>
            </div>

            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-white">
                        {order.customerName}
                      </p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {order.product?.name || order.productName}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="font-black text-green-400">
                        {formatCurrency(order.amount)}
                      </p>

                      <p
                        className={
                          order.paymentStatus === "paid"
                            ? "mt-1 text-xs font-black text-green-400"
                            : order.paymentStatus === "cancelled"
                            ? "mt-1 text-xs font-black text-red-400"
                            : "mt-1 text-xs font-black text-yellow-400"
                        }
                      >
                        {order.paymentStatus === "paid"
                          ? "Pago"
                          : order.paymentStatus === "cancelled"
                          ? "Cancelado"
                          : "Pendente"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {recentOrders.length === 0 && (
                <div className="rounded-2xl bg-zinc-800 p-4 text-zinc-400">
                  Nenhum pedido ainda.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-zinc-900 p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-yellow-400">
                Recuperação
              </p>
              <h2 className="mt-1 text-2xl font-black">Leads recentes</h2>
            </div>

            <a
              href="/painel/leads"
              className="text-sm font-bold text-yellow-400 hover:text-yellow-300"
            >
              Ver leads
            </a>
          </div>

          <div className="grid gap-3 lg:grid-cols-5">
            {recentLeads.map((lead) => (
              <div
                key={lead.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
              >
                <p className="font-black text-white">{lead.customerName}</p>
                <p className="mt-1 truncate text-sm text-zinc-400">
                  {lead.customerEmail}
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  {lead.productName}
                </p>

                <span
                  className={
                    lead.status === "converted"
                      ? "mt-3 inline-block rounded-full bg-green-500/20 px-3 py-1 text-xs font-black text-green-400"
                      : lead.status === "contacted"
                      ? "mt-3 inline-block rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black text-blue-400"
                      : "mt-3 inline-block rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-black text-yellow-400"
                  }
                >
                  {lead.status === "converted"
                    ? "Convertido"
                    : lead.status === "contacted"
                    ? "Contato feito"
                    : "Abandonado"}
                </span>
              </div>
            ))}

            {recentLeads.length === 0 && (
              <div className="rounded-2xl bg-zinc-800 p-4 text-zinc-400 lg:col-span-5">
                Nenhum lead capturado ainda.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
