"use client";

import { useEffect, useMemo, useState } from "react";

type Period = "today" | "7d" | "30d" | "month" | "all";

type Order = {
  id: string;
  productName: string;
  amount: number;
  paymentStatus: string;
  orderBump?: boolean;
  isUpsellOrder?: boolean;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  notes?: string | null;
  expenseDate: string;
  createdAt: string;
};

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0,0%";
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function todayDateInput() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localDate = new Date(today.getTime() - offset * 60 * 1000);
  return localDate.toISOString().split("T")[0];
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function getPeriodRange(period: Period) {
  const now = new Date();

  if (period === "all") {
    return {
      start: null,
      end: null,
      label: "Todos os períodos",
    };
  }

  if (period === "today") {
    return {
      start: startOfDay(now),
      end: endOfDay(now),
      label: "Hoje",
    };
  }

  if (period === "7d") {
    const start = startOfDay(new Date(now));
    start.setDate(start.getDate() - 6);

    return {
      start,
      end: endOfDay(now),
      label: "Últimos 7 dias",
    };
  }

  if (period === "30d") {
    const start = startOfDay(new Date(now));
    start.setDate(start.getDate() - 29);

    return {
      start,
      end: endOfDay(now),
      label: "Últimos 30 dias",
    };
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endOfDay(now);

  return {
    start,
    end,
    label: "Mês atual",
  };
}

function isInsidePeriod(dateValue: string, period: Period) {
  const range = getPeriodRange(period);

  if (!range.start || !range.end) {
    return true;
  }

  const date = new Date(dateValue);

  return date >= range.start && date <= range.end;
}

function getLastSevenDays() {
  const days: Date[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = startOfDay(new Date());
    date.setDate(date.getDate() - i);
    days.push(date);
  }

  return days;
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "short",
  });
}

export default function FinanceiroPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [period, setPeriod] = useState<Period>("7d");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "Meta Ads",
    category: "Meta Ads",
    amount: "",
    expenseDate: todayDateInput(),
    notes: "",
  });

  async function loadData() {
    setLoading(true);

    const [ordersResponse, expensesResponse] = await Promise.all([
      fetch("/api/orders"),
      fetch("/api/expenses"),
    ]);

    const ordersData = await ordersResponse.json();
    const expensesData = await expensesResponse.json();

    setOrders(Array.isArray(ordersData) ? ordersData : []);
    setExpenses(Array.isArray(expensesData) ? expensesData : []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("Gasto adicionado com sucesso.");
      setForm({
        title: "Meta Ads",
        category: "Meta Ads",
        amount: "",
        expenseDate: todayDateInput(),
        notes: "",
      });
      await loadData();
    } else {
      setMessage(data.error || "Erro ao adicionar gasto.");
    }

    setSaving(false);
  }

  async function deleteExpense(expenseId: string) {
    const confirmDelete = confirm("Remover este gasto?");

    if (!confirmDelete) return;

    const response = await fetch("/api/expenses", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expenseId }),
    });

    if (response.ok) {
      await loadData();
    }
  }

  const metrics = useMemo(() => {
    const periodOrders = orders.filter((order) =>
      isInsidePeriod(order.createdAt, period)
    );

    const periodExpenses = expenses.filter((expense) =>
      isInsidePeriod(expense.expenseDate, period)
    );

    const paidOrders = periodOrders.filter(
      (order) => order.paymentStatus === "paid"
    );

    const pendingOrders = periodOrders.filter(
      (order) => order.paymentStatus === "pending"
    );

    const totalRevenue = paidOrders.reduce((sum, order) => sum + order.amount, 0);

    const upsellOrders = paidOrders.filter((order) => order.isUpsellOrder);
    const upsellRevenue = upsellOrders.reduce(
      (sum, order) => sum + order.amount,
      0
    );

    const bumpOrders = paidOrders.filter((order) => order.orderBump);
    const bumpRevenue = bumpOrders.reduce((sum) => sum + 9.9, 0);

    const totalExpenses = periodExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const profit = totalRevenue - totalExpenses;
    const roi = totalExpenses > 0 ? (profit / totalExpenses) * 100 : 0;
    const cpa = paidOrders.length > 0 ? totalExpenses / paidOrders.length : 0;
    const averageTicket =
      paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    const approvalRate =
      periodOrders.length > 0 ? (paidOrders.length / periodOrders.length) * 100 : 0;

    const periodLabel = getPeriodRange(period).label;

    const dailyChart = getLastSevenDays().map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const dayRevenue = orders
        .filter((order) => {
          const createdAt = new Date(order.createdAt);
          return (
            order.paymentStatus === "paid" &&
            createdAt >= dayStart &&
            createdAt <= dayEnd
          );
        })
        .reduce((sum, order) => sum + order.amount, 0);

      const dayExpenses = expenses
        .filter((expense) => {
          const expenseDate = new Date(expense.expenseDate);
          return expenseDate >= dayStart && expenseDate <= dayEnd;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        label: formatShortDate(day),
        revenue: dayRevenue,
        expenses: dayExpenses,
        profit: dayRevenue - dayExpenses,
      };
    });

    const maxChartValue = Math.max(
      1,
      ...dailyChart.map((item) => Math.abs(item.profit))
    );

    return {
      periodOrders,
      periodExpenses,
      paidOrders,
      pendingOrders,
      totalRevenue,
      upsellOrders,
      upsellRevenue,
      bumpOrders,
      bumpRevenue,
      totalExpenses,
      profit,
      roi,
      cpa,
      averageTicket,
      approvalRate,
      periodLabel,
      dailyChart,
      maxChartValue,
    };
  }, [orders, expenses, period]);

  const periods: { value: Period; label: string }[] = [
    { value: "today", label: "Hoje" },
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "month", label: "Mês atual" },
    { value: "all", label: "Todos" },
  ];

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-green-400">
              Painel administrativo
            </p>

            <h1 className="mt-2 text-3xl font-black lg:text-4xl">
              Financeiro e lucro
            </h1>

            <p className="mt-2 max-w-2xl text-zinc-400">
              Veja lucro, gastos, ROI e CPA por período.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/painel"
              className="rounded-xl bg-zinc-800 px-5 py-3 font-bold text-white hover:bg-zinc-700"
            >
              Dashboard
            </a>

            <a
              href="/painel/pedidos"
              className="rounded-xl bg-zinc-800 px-5 py-3 font-bold text-white hover:bg-zinc-700"
            >
              Pedidos
            </a>

            <a
              href="/painel/produtos"
              className="rounded-xl bg-green-600 px-5 py-3 font-black text-white hover:bg-green-700"
            >
              Produtos
            </a>
          </div>
        </div>

        <div className="mb-6 rounded-3xl bg-zinc-900 p-4">
          <p className="mb-3 text-sm font-bold text-zinc-400">
            Filtrar período
          </p>

          <div className="flex flex-wrap gap-2">
            {periods.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setPeriod(item.value)}
                className={
                  period === item.value
                    ? "rounded-xl bg-green-600 px-4 py-2 text-sm font-black text-white"
                    : "rounded-xl bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-700"
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs font-bold text-green-400">
            Exibindo: {metrics.periodLabel}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-zinc-900 p-5 shadow-xl">
            <p className="text-sm text-zinc-400">Faturamento no período</p>
            <strong className="mt-2 block text-3xl text-green-400">
              {formatCurrency(metrics.totalRevenue)}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5 shadow-xl">
            <p className="text-sm text-zinc-400">Gastos no período</p>
            <strong className="mt-2 block text-3xl text-red-400">
              {formatCurrency(metrics.totalExpenses)}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5 shadow-xl">
            <p className="text-sm text-zinc-400">Lucro no período</p>
            <strong
              className={
                metrics.profit >= 0
                  ? "mt-2 block text-3xl text-green-400"
                  : "mt-2 block text-3xl text-red-400"
              }
            >
              {formatCurrency(metrics.profit)}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5 shadow-xl">
            <p className="text-sm text-zinc-400">ROI no período</p>
            <strong
              className={
                metrics.roi >= 0
                  ? "mt-2 block text-3xl text-green-400"
                  : "mt-2 block text-3xl text-red-400"
              }
            >
              {formatPercent(metrics.roi)}
            </strong>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">CPA médio</p>
            <strong className="mt-2 block text-3xl text-white">
              {formatCurrency(metrics.cpa)}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Ticket médio</p>
            <strong className="mt-2 block text-3xl text-white">
              {formatCurrency(metrics.averageTicket)}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Taxa de aprovação</p>
            <strong className="mt-2 block text-3xl text-green-400">
              {formatPercent(metrics.approvalRate)}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Receita de upsell</p>
            <strong className="mt-2 block text-3xl text-purple-400">
              {formatCurrency(metrics.upsellRevenue)}
            </strong>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl">
            <h2 className="text-2xl font-black">Adicionar gasto</h2>

            <p className="mt-2 text-sm text-zinc-600">
              Registre gastos com anúncios, ferramentas, domínio, hospedagem ou
              qualquer custo da operação.
            </p>

            <form onSubmit={createExpense} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold">Título</label>
                <input
                  required
                  className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                  placeholder="Ex: Campanha Meta Ads"
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Categoria</label>
                <select
                  className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      category: event.target.value,
                    }))
                  }
                >
                  <option>Meta Ads</option>
                  <option>Google Ads</option>
                  <option>TikTok Ads</option>
                  <option>Hospedagem</option>
                  <option>Domínio</option>
                  <option>Ferramentas</option>
                  <option>Designer</option>
                  <option>Outros</option>
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold">Valor</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    placeholder="30.00"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        amount: event.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">Data</label>
                  <input
                    required
                    type="date"
                    className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    value={form.expenseDate}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        expenseDate: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Observação</label>
                <textarea
                  className="h-24 w-full resize-none rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                  placeholder="Ex: Campanha teste para produto principal"
                  value={form.notes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: event.target.value,
                    }))
                  }
                />
              </div>

              {message && (
                <p className="rounded-xl bg-zinc-100 p-3 text-sm font-bold text-zinc-700">
                  {message}
                </p>
              )}

              <button
                disabled={saving}
                className="w-full rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Adicionar gasto"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-zinc-900 p-5 shadow-2xl">
            <div className="mb-5">
              <p className="text-sm font-bold text-green-400">
                Gráfico simples
              </p>
              <h2 className="mt-1 text-2xl font-black">
                Lucro dos últimos 7 dias
              </h2>
            </div>

            <div className="space-y-4">
              {metrics.dailyChart.map((item) => {
                const width = Math.max(
                  8,
                  (Math.abs(item.profit) / metrics.maxChartValue) * 100
                );

                return (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-bold capitalize text-zinc-300">
                        {item.label}
                      </span>

                      <span
                        className={
                          item.profit >= 0
                            ? "font-black text-green-400"
                            : "font-black text-red-400"
                        }
                      >
                        {formatCurrency(item.profit)}
                      </span>
                    </div>

                    <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={
                          item.profit >= 0
                            ? "h-full rounded-full bg-green-500"
                            : "h-full rounded-full bg-red-500"
                        }
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-2xl bg-zinc-800 p-4 text-sm text-zinc-300">
              Receita menos gastos cadastrados em cada dia.
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl bg-zinc-900 p-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-green-400">
                Histórico financeiro
              </p>
              <h2 className="mt-1 text-2xl font-black">Gastos cadastrados</h2>
            </div>

            <p className="rounded-full bg-zinc-800 px-4 py-2 text-sm font-bold text-zinc-300">
              {metrics.periodExpenses.length} item(s) no filtro
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-zinc-800 p-5 text-zinc-400">
              Carregando financeiro...
            </div>
          ) : metrics.periodExpenses.length === 0 ? (
            <div className="rounded-2xl bg-zinc-800 p-5 text-zinc-400">
              Nenhum gasto encontrado neste período.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {metrics.periodExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-black text-white">{expense.title}</p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {expense.category} •{" "}
                        {new Date(expense.expenseDate).toLocaleDateString(
                          "pt-BR"
                        )}
                      </p>

                      {expense.notes && (
                        <p className="mt-2 text-sm text-zinc-500">
                          {expense.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xl font-black text-red-400">
                        {formatCurrency(expense.amount)}
                      </p>

                      <button
                        type="button"
                        onClick={() => deleteExpense(expense.id)}
                        className="mt-2 rounded-xl bg-red-500/10 px-4 py-2 text-xs font-black text-red-300 hover:bg-red-500/20"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
