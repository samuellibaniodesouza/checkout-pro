"use client";

import { useEffect, useState } from "react";

type CheckoutSettings = {
  checkoutTitle: string;
  checkoutSubtitle: string;
  checkoutButtonText: string;
  checkoutGuaranteeText: string;
  primaryColor: string;
  secondaryColor: string;

  orderBumpEnabled: boolean;
  orderBumpName: string;
  orderBumpDescription: string;
  orderBumpPrice: number;
  orderBumpOldPrice: number;
  orderBumpBadge: string;
  orderBumpButtonText: string;
  orderBumpBenefits: string;
};

const defaultForm: CheckoutSettings = {
  checkoutTitle: "Finalize sua compra com segurança",
  checkoutSubtitle: "Produto digital com acesso após confirmação do pagamento.",
  checkoutButtonText: "Comprar agora com segurança",
  checkoutGuaranteeText:
    "Seus dados estão protegidos. Não armazenamos dados de cartão.",
  primaryColor: "#16a34a",
  secondaryColor: "#7e22ce",

  orderBumpEnabled: true,
  orderBumpName: "Kit Fornecedores Premium",
  orderBumpDescription:
    "Receba uma lista prática com fornecedores, ideias de compra de matéria-prima e caminhos para começar vendendo mais rápido.",
  orderBumpPrice: 9.9,
  orderBumpOldPrice: 19.9,
  orderBumpBadge: "Oferta rápida",
  orderBumpButtonText: "adicionar ao pedido",
  orderBumpBenefits:
    "Lista de fornecedores\nMatérias-primas\nIdeias para revenda\nAcesso imediato",
};

export default function ConfiguracoesPage() {
  const [form, setForm] = useState<CheckoutSettings>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSettings() {
    setLoading(true);

    const response = await fetch("/api/settings");
    const data = await response.json();

    if (response.ok) {
      setForm({
        checkoutTitle: data.checkoutTitle || defaultForm.checkoutTitle,
        checkoutSubtitle: data.checkoutSubtitle || defaultForm.checkoutSubtitle,
        checkoutButtonText:
          data.checkoutButtonText || defaultForm.checkoutButtonText,
        checkoutGuaranteeText:
          data.checkoutGuaranteeText || defaultForm.checkoutGuaranteeText,
        primaryColor: data.primaryColor || defaultForm.primaryColor,
        secondaryColor: data.secondaryColor || defaultForm.secondaryColor,

        orderBumpEnabled: data.orderBumpEnabled ?? true,
        orderBumpName: data.orderBumpName || defaultForm.orderBumpName,
        orderBumpDescription:
          data.orderBumpDescription || defaultForm.orderBumpDescription,
        orderBumpPrice: Number(data.orderBumpPrice || defaultForm.orderBumpPrice),
        orderBumpOldPrice: Number(
          data.orderBumpOldPrice || defaultForm.orderBumpOldPrice
        ),
        orderBumpBadge: data.orderBumpBadge || defaultForm.orderBumpBadge,
        orderBumpButtonText:
          data.orderBumpButtonText || defaultForm.orderBumpButtonText,
        orderBumpBenefits:
          data.orderBumpBenefits || defaultForm.orderBumpBenefits,
      });
    }

    setLoading(false);
  }

  function updateForm(
    field: keyof CheckoutSettings,
    value: string | number | boolean
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("Configurações salvas com sucesso.");
      setForm({
        ...form,
        ...data,
      });
    } else {
      setMessage(data.error || "Erro ao salvar configurações.");
    }

    setSaving(false);
  }

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-green-400">
              Painel administrativo
            </p>

            <h1 className="mt-2 text-3xl font-black lg:text-4xl">
              Configurações do checkout
            </h1>

            <p className="mt-2 max-w-2xl text-zinc-400">
              Edite textos, botão, garantia, cores e o order bump sem mexer no
              código.
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
              href="/painel/produtos"
              className="rounded-xl bg-green-600 px-5 py-3 font-black text-white hover:bg-green-700"
            >
              Produtos
            </a>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-zinc-900 p-6 text-zinc-400">
            Carregando configurações...
          </div>
        ) : (
          <form onSubmit={saveSettings} className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <section className="space-y-6">
              <div className="rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl">
                <h2 className="text-2xl font-black">Textos do checkout</h2>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Título principal
                    </label>
                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={form.checkoutTitle}
                      onChange={(event) =>
                        updateForm("checkoutTitle", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Subtítulo
                    </label>
                    <textarea
                      className="h-24 w-full resize-none rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={form.checkoutSubtitle}
                      onChange={(event) =>
                        updateForm("checkoutSubtitle", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Texto do botão
                    </label>
                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={form.checkoutButtonText}
                      onChange={(event) =>
                        updateForm("checkoutButtonText", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Texto de segurança/garantia
                    </label>
                    <textarea
                      className="h-24 w-full resize-none rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={form.checkoutGuaranteeText}
                      onChange={(event) =>
                        updateForm("checkoutGuaranteeText", event.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl">
                <h2 className="text-2xl font-black">Cores</h2>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Cor principal
                    </label>
                    <input
                      type="color"
                      className="h-14 w-full rounded-xl border border-zinc-300 p-2"
                      value={form.primaryColor}
                      onChange={(event) =>
                        updateForm("primaryColor", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Cor secundária
                    </label>
                    <input
                      type="color"
                      className="h-14 w-full rounded-xl border border-zinc-300 p-2"
                      value={form.secondaryColor}
                      onChange={(event) =>
                        updateForm("secondaryColor", event.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">Order Bump</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Oferta selecionável dentro do checkout.
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-100 px-4 py-3 text-sm font-black">
                    <input
                      type="checkbox"
                      checked={form.orderBumpEnabled}
                      onChange={(event) =>
                        updateForm("orderBumpEnabled", event.target.checked)
                      }
                    />
                    Ativo
                  </label>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Selo do bump
                    </label>
                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={form.orderBumpBadge}
                      onChange={(event) =>
                        updateForm("orderBumpBadge", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Nome do bump
                    </label>
                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={form.orderBumpName}
                      onChange={(event) =>
                        updateForm("orderBumpName", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Descrição do bump
                    </label>
                    <textarea
                      className="h-28 w-full resize-none rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={form.orderBumpDescription}
                      onChange={(event) =>
                        updateForm("orderBumpDescription", event.target.value)
                      }
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        Preço antigo
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                        value={form.orderBumpOldPrice}
                        onChange={(event) =>
                          updateForm(
                            "orderBumpOldPrice",
                            Number(event.target.value)
                          )
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        Preço atual
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                        value={form.orderBumpPrice}
                        onChange={(event) =>
                          updateForm(
                            "orderBumpPrice",
                            Number(event.target.value)
                          )
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Checklist do bump
                    </label>
                    <textarea
                      className="h-36 w-full resize-none rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={form.orderBumpBenefits}
                      onChange={(event) =>
                        updateForm("orderBumpBenefits", event.target.value)
                      }
                    />
                    <p className="mt-2 text-xs text-zinc-500">
                      Digite um benefício por linha.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Texto pequeno do botão/selo
                    </label>
                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={form.orderBumpButtonText}
                      onChange={(event) =>
                        updateForm("orderBumpButtonText", event.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-zinc-900 p-5">
                <h2 className="text-2xl font-black">Prévia rápida</h2>

                <div className="mt-5 rounded-3xl bg-white p-4 text-zinc-900">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                    {form.orderBumpBadge}
                  </p>

                  <h3 className="mt-1 text-lg font-black">
                    {form.orderBumpName}
                  </h3>

                  <p className="mt-2 text-sm font-bold text-zinc-600">
                    {form.orderBumpDescription}
                  </p>

                  <ul className="mt-3 grid gap-2 text-sm font-bold text-zinc-800 sm:grid-cols-2">
                    {form.orderBumpBenefits
                      .split("\n")
                      .map((item) => item.trim())
                      .filter(Boolean)
                      .slice(0, 6)
                      .map((item, index) => (
                        <li key={index}>✅ {item}</li>
                      ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap items-end gap-2">
                    <span className="text-sm font-bold text-zinc-400 line-through">
                      R$ {Number(form.orderBumpOldPrice || 0).toFixed(2).replace(".", ",")}
                    </span>

                    <span className="text-2xl font-black text-green-600">
                      R$ {Number(form.orderBumpPrice || 0).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>

                {message && (
                  <p className="mt-4 rounded-xl bg-zinc-800 p-3 text-sm font-bold text-green-400">
                    {message}
                  </p>
                )}

                <button
                  disabled={saving}
                  className="mt-5 w-full rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Salvar configurações"}
                </button>
              </div>
            </section>
          </form>
        )}
      </div>
    </main>
  );
}
