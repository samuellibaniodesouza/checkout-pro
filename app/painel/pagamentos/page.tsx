"use client";

import { useEffect, useState } from "react";

type PaymentSettings = {
  provider: string;
  environment: string;
  mercadoPagoAccessToken: string;
  mercadoPagoAccessTokenMasked?: string;
  mercadoPagoPublicKey: string;
  mercadoPagoAccountEmail: string;
  receiverName: string;

  manualPixEnabled: boolean;
  manualPixKey: string;
  manualPixKeyType: string;
  manualPixReceiverName: string;
  manualPixBankName: string;
};

const defaultForm: PaymentSettings = {
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
};

export default function PagamentosPage() {
  const [form, setForm] = useState<PaymentSettings>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSettings() {
    setLoading(true);

    const response = await fetch("/api/payment-settings");
    const data = await response.json();

    if (response.ok) {
      setForm({
        ...defaultForm,
        ...data,
      });
    }

    setLoading(false);
  }

  function updateForm(field: keyof PaymentSettings, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    const response = await fetch("/api/payment-settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("Configurações de pagamento salvas com sucesso.");
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

  const mercadoPagoReady = Boolean(form.mercadoPagoAccessToken);
  const manualPixReady = Boolean(form.manualPixEnabled && form.manualPixKey);

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-green-400">
              Painel administrativo
            </p>

            <h1 className="mt-2 text-3xl font-black lg:text-4xl">
              Configurações de pagamento
            </h1>

            <p className="mt-2 max-w-2xl text-zinc-400">
              Configure o Mercado Pago para gerar PIX e, se quiser, deixe uma
              chave PIX manual cadastrada como opção futura.
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

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Mercado Pago</p>
            <strong
              className={
                mercadoPagoReady
                  ? "mt-2 block text-2xl text-green-400"
                  : "mt-2 block text-2xl text-yellow-400"
              }
            >
              {mercadoPagoReady ? "Configurado" : "Pendente"}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Ambiente</p>
            <strong className="mt-2 block text-2xl text-white">
              {form.environment === "production" ? "Produção" : "Teste"}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">PIX manual</p>
            <strong
              className={
                manualPixReady
                  ? "mt-2 block text-2xl text-green-400"
                  : "mt-2 block text-2xl text-zinc-400"
              }
            >
              {manualPixReady ? "Ativo" : "Desativado"}
            </strong>
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
                <h2 className="text-2xl font-black">Mercado Pago</h2>

                <p className="mt-2 rounded-2xl bg-yellow-50 p-4 text-sm font-bold leading-relaxed text-yellow-800">
                  Para o PIX cair na sua conta, o Access Token precisa ser da
                  sua própria conta Mercado Pago. O sistema gera o PIX usando
                  essa credencial.
                </p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Ambiente
                    </label>

                    <select
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={form.environment}
                      onChange={(event) =>
                        updateForm("environment", event.target.value)
                      }
                    >
                      <option value="test">Teste</option>
                      <option value="production">Produção</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Access Token Mercado Pago
                    </label>

                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 font-mono text-sm outline-none focus:border-green-600"
                      placeholder="APP_USR-... ou TEST-..."
                      value={form.mercadoPagoAccessToken || ""}
                      onChange={(event) =>
                        updateForm("mercadoPagoAccessToken", event.target.value)
                      }
                    />

                    {form.mercadoPagoAccessTokenMasked && (
                      <p className="mt-2 text-xs text-zinc-500">
                        Token salvo: {form.mercadoPagoAccessTokenMasked}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Public Key Mercado Pago
                    </label>

                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 font-mono text-sm outline-none focus:border-green-600"
                      placeholder="APP_USR-... ou TEST-..."
                      value={form.mercadoPagoPublicKey || ""}
                      onChange={(event) =>
                        updateForm("mercadoPagoPublicKey", event.target.value)
                      }
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        Nome do recebedor
                      </label>

                      <input
                        className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                        placeholder="Seu nome ou empresa"
                        value={form.receiverName || ""}
                        onChange={(event) =>
                          updateForm("receiverName", event.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-bold">
                        E-mail da conta Mercado Pago
                      </label>

                      <input
                        type="email"
                        className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                        placeholder="email@mercadopago.com"
                        value={form.mercadoPagoAccountEmail || ""}
                        onChange={(event) =>
                          updateForm("mercadoPagoAccountEmail", event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-black">PIX manual</h2>

                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                      Opcional. É útil se no futuro você quiser mostrar sua chave
                      PIX própria e confirmar manualmente o pedido.
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-100 px-4 py-3 text-sm font-black">
                    <input
                      type="checkbox"
                      checked={form.manualPixEnabled}
                      onChange={(event) =>
                        updateForm("manualPixEnabled", event.target.checked)
                      }
                    />
                    Ativo
                  </label>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Tipo da chave
                    </label>

                    <select
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={form.manualPixKeyType || "email"}
                      onChange={(event) =>
                        updateForm("manualPixKeyType", event.target.value)
                      }
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="phone">Telefone</option>
                      <option value="random">Aleatória</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Chave PIX
                    </label>

                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      placeholder="Sua chave PIX"
                      value={form.manualPixKey || ""}
                      onChange={(event) =>
                        updateForm("manualPixKey", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Nome do recebedor PIX manual
                    </label>

                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      placeholder="Nome que aparece no banco"
                      value={form.manualPixReceiverName || ""}
                      onChange={(event) =>
                        updateForm("manualPixReceiverName", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Banco / observação
                    </label>

                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      placeholder="Ex: Mercado Pago, Nubank, Inter..."
                      value={form.manualPixBankName || ""}
                      onChange={(event) =>
                        updateForm("manualPixBankName", event.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-zinc-900 p-5">
                <h2 className="text-2xl font-black">Resumo</h2>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-3 border-b border-zinc-800 pb-3">
                    <span className="text-zinc-400">Recebimento atual</span>
                    <strong className="text-right">
                      {mercadoPagoReady
                        ? "Mercado Pago"
                        : "Não configurado"}
                    </strong>
                  </div>

                  <div className="flex justify-between gap-3 border-b border-zinc-800 pb-3">
                    <span className="text-zinc-400">Ambiente</span>
                    <strong className="text-right">
                      {form.environment === "production" ? "Produção" : "Teste"}
                    </strong>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-zinc-400">PIX manual</span>
                    <strong className="text-right">
                      {manualPixReady ? form.manualPixKey : "Desativado"}
                    </strong>
                  </div>
                </div>

                {message && (
                  <p className="mt-5 rounded-xl bg-zinc-800 p-3 text-sm font-bold text-green-400">
                    {message}
                  </p>
                )}

                <button
                  disabled={saving}
                  className="mt-5 w-full rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Salvando..." : "Salvar pagamentos"}
                </button>
              </div>
            </section>
          </form>
        )}
      </div>
    </main>
  );
}
