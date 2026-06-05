"use client";

import { useEffect, useMemo, useState } from "react";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  isActive: boolean;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  createdAt: string;
  paidOrdersCount?: number;
  revenue?: number;
  discountTotal?: number;
};

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function formatDiscount(coupon: Coupon) {
  if (coupon.type === "fixed") {
    return formatCurrency(coupon.value);
  }

  return `${coupon.value.toFixed(0)}%`;
}

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    code: "",
    type: "percent",
    value: "",
    isActive: true,
    usageLimit: "",
    expiresAt: "",
  });

  async function loadCoupons() {
    setLoading(true);

    const response = await fetch("/api/coupons");
    const data = await response.json();

    setCoupons(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function createCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const response = await fetch("/api/coupons", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("Cupom criado com sucesso.");
      setForm({
        code: "",
        type: "percent",
        value: "",
        isActive: true,
        usageLimit: "",
        expiresAt: "",
      });
      await loadCoupons();
    } else {
      setMessage(data.error || "Erro ao criar cupom.");
    }

    setSaving(false);
  }

  async function toggleCoupon(coupon: Coupon) {
    const response = await fetch("/api/coupons", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        couponId: coupon.id,
        isActive: !coupon.isActive,
      }),
    });

    if (response.ok) {
      await loadCoupons();
    }
  }

  async function deleteCoupon(couponId: string) {
    const confirmDelete = confirm("Remover este cupom?");

    if (!confirmDelete) return;

    const response = await fetch("/api/coupons", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        couponId,
      }),
    });

    if (response.ok) {
      await loadCoupons();
    }
  }

  useEffect(() => {
    loadCoupons();
  }, []);

  const metrics = useMemo(() => {
    const active = coupons.filter((coupon) => coupon.isActive).length;
    const totalUses = coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0);
    const expired = coupons.filter(
      (coupon) => coupon.expiresAt && new Date(coupon.expiresAt) < new Date()
    ).length;

    const totalRevenue = coupons.reduce(
      (sum, coupon) => sum + Number(coupon.revenue || 0),
      0
    );

    const totalDiscount = coupons.reduce(
      (sum, coupon) => sum + Number(coupon.discountTotal || 0),
      0
    );

    const champion = [...coupons].sort(
      (a, b) => Number(b.revenue || 0) - Number(a.revenue || 0)
    )[0];

    return {
      active,
      totalUses,
      expired,
      totalRevenue,
      totalDiscount,
      champion,
    };
  }, [coupons]);

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-green-400">
              Painel administrativo
            </p>

            <h1 className="mt-2 text-3xl font-black lg:text-4xl">
              Cupons de desconto
            </h1>

            <p className="mt-2 max-w-2xl text-zinc-400">
              Crie cupons e acompanhe receita, usos e descontos concedidos.
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
              href="/painel/configuracoes"
              className="rounded-xl bg-purple-700 px-5 py-3 font-black text-white hover:bg-purple-800"
            >
              Configurações
            </a>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Cupons cadastrados</p>
            <strong className="mt-2 block text-3xl text-white">
              {coupons.length}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Ativos</p>
            <strong className="mt-2 block text-3xl text-green-400">
              {metrics.active}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Usos totais</p>
            <strong className="mt-2 block text-3xl text-yellow-400">
              {metrics.totalUses}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Receita com cupom</p>
            <strong className="mt-2 block text-3xl text-green-400">
              {formatCurrency(metrics.totalRevenue)}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Descontos dados</p>
            <strong className="mt-2 block text-3xl text-red-400">
              {formatCurrency(metrics.totalDiscount)}
            </strong>
          </div>
        </div>

        {metrics.champion && (
          <div className="mb-8 rounded-3xl bg-gradient-to-br from-blue-500/20 to-zinc-900 p-5">
            <p className="text-sm font-bold text-blue-300">🏆 Cupom campeão</p>
            <h2 className="mt-2 text-3xl font-black">{metrics.champion.code}</h2>
            <p className="mt-2 text-zinc-300">
              Receita:{" "}
              <span className="font-black text-green-400">
                {formatCurrency(Number(metrics.champion.revenue || 0))}
              </span>{" "}
              • Usos: {metrics.champion.usedCount} • Desconto total:{" "}
              <span className="font-black text-red-400">
                {formatCurrency(Number(metrics.champion.discountTotal || 0))}
              </span>
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl">
            <h2 className="text-2xl font-black">Criar cupom</h2>

            <form onSubmit={createCoupon} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Código do cupom
                </label>

                <input
                  required
                  className="w-full rounded-xl border border-zinc-300 p-4 font-black uppercase outline-none focus:border-green-600"
                  placeholder="DESCONTO10"
                  value={form.code}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      code: event.target.value.toUpperCase().replace(/\s+/g, ""),
                    }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold">Tipo</label>

                  <select
                    className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    value={form.type}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        type: event.target.value,
                      }))
                    }
                  >
                    <option value="percent">Percentual (%)</option>
                    <option value="fixed">Valor fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">Valor</label>

                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    placeholder={form.type === "percent" ? "10" : "5.00"}
                    value={form.value}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        value: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Limite de uso
                  </label>

                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    placeholder="Vazio = ilimitado"
                    value={form.usageLimit}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        usageLimit: event.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Validade
                  </label>

                  <input
                    type="date"
                    className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    value={form.expiresAt}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        expiresAt: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-zinc-100 p-4 font-bold">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      isActive: event.target.checked,
                    }))
                  }
                />
                Cupom ativo
              </label>

              {message && (
                <p className="rounded-xl bg-zinc-100 p-3 text-sm font-bold text-zinc-700">
                  {message}
                </p>
              )}

              <button
                disabled={saving}
                className="w-full rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Criar cupom"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-zinc-900 p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-green-400">
                  Cupons criados
                </p>
                <h2 className="mt-1 text-2xl font-black">Lista de cupons</h2>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-zinc-800 p-5 text-zinc-400">
                Carregando cupons...
              </div>
            ) : coupons.length === 0 ? (
              <div className="rounded-2xl bg-zinc-800 p-5 text-zinc-400">
                Nenhum cupom criado ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-2xl font-black text-white">
                          {coupon.code}
                        </p>

                        <p className="mt-1 text-sm text-zinc-400">
                          Desconto:{" "}
                          <span className="font-black text-green-400">
                            {formatDiscount(coupon)}
                          </span>
                        </p>

                        <div className="mt-3 grid gap-2 text-sm text-zinc-300 sm:grid-cols-3">
                          <div className="rounded-xl bg-zinc-900 p-3">
                            <p className="text-xs text-zinc-500">Pedidos pagos</p>
                            <strong className="text-green-400">
                              {coupon.paidOrdersCount || 0}
                            </strong>
                          </div>

                          <div className="rounded-xl bg-zinc-900 p-3">
                            <p className="text-xs text-zinc-500">Receita</p>
                            <strong className="text-green-400">
                              {formatCurrency(Number(coupon.revenue || 0))}
                            </strong>
                          </div>

                          <div className="rounded-xl bg-zinc-900 p-3">
                            <p className="text-xs text-zinc-500">Desconto</p>
                            <strong className="text-red-400">
                              {formatCurrency(Number(coupon.discountTotal || 0))}
                            </strong>
                          </div>
                        </div>

                        <p className="mt-3 text-xs text-zinc-500">
                          Usos: {coupon.usedCount}
                          {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / ilimitado"}
                        </p>

                        {coupon.expiresAt && (
                          <p className="mt-1 text-xs text-zinc-500">
                            Validade:{" "}
                            {new Date(coupon.expiresAt).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>

                      <div className="grid min-w-[150px] gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCoupon(coupon)}
                          className={
                            coupon.isActive
                              ? "rounded-xl bg-yellow-600 px-4 py-2 text-xs font-black text-white hover:bg-yellow-700"
                              : "rounded-xl bg-green-600 px-4 py-2 text-xs font-black text-white hover:bg-green-700"
                          }
                        >
                          {coupon.isActive ? "Desativar" : "Ativar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteCoupon(coupon.id)}
                          className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700"
                        >
                          Remover
                        </button>
                      </div>
                    </div>

                    <span
                      className={
                        coupon.isActive
                          ? "mt-3 inline-block rounded-full bg-green-500/20 px-3 py-1 text-xs font-black text-green-400"
                          : "mt-3 inline-block rounded-full bg-red-500/20 px-3 py-1 text-xs font-black text-red-400"
                      }
                    >
                      {coupon.isActive ? "Ativo" : "Desativado"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
