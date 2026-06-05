"use client";

import { useEffect, useState } from "react";

type IntegrationSettings = {
  metaPixelId: string;
  metaAccessToken: string;
  metaAccessTokenMasked?: string;
  metaGraphVersion: string;
  metaTestCode: string;
};

const defaultForm: IntegrationSettings = {
  metaPixelId: "",
  metaAccessToken: "",
  metaGraphVersion: "v21.0",
  metaTestCode: "",
};

export default function IntegracoesPage() {
  const [form, setForm] = useState<IntegrationSettings>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");
  const [testResult, setTestResult] = useState<any>(null);

  async function loadSettings() {
    setLoading(true);

    const response = await fetch("/api/integration-settings");
    const data = await response.json();

    if (response.ok) {
      setForm({
        ...defaultForm,
        ...data,
      });
    }

    setLoading(false);
  }

  function updateForm(field: keyof IntegrationSettings, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setTestResult(null);

    const response = await fetch("/api/integration-settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("Integrações salvas com sucesso.");
      setForm({
        ...form,
        ...data,
      });
    } else {
      setMessage(data.error || "Erro ao salvar integrações.");
    }

    setSaving(false);
  }

  async function testMetaPurchase() {
    setTesting(true);
    setMessage("");
    setTestResult(null);

    await fetch("/api/integration-settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const response = await fetch("/api/meta/test-purchase", {
      method: "POST",
    });

    const data = await response.json();

    setTestResult(data);

    if (response.ok) {
      setMessage("Teste enviado para Meta com sucesso.");
    } else {
      setMessage(data.error || "Erro ao testar Meta.");
    }

    setTesting(false);
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const metaReady = Boolean(form.metaPixelId && form.metaAccessToken);

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-green-400">
              Painel administrativo
            </p>

            <h1 className="mt-2 text-3xl font-black lg:text-4xl">
              Integrações
            </h1>

            <p className="mt-2 max-w-2xl text-zinc-400">
              Configure e teste Meta Pixel / Conversions API antes de rodar
              tráfego pago.
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
              href="/painel/pagamentos"
              className="rounded-xl bg-green-700 px-5 py-3 font-black text-white hover:bg-green-800"
            >
              Pagamentos
            </a>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Meta Pixel</p>
            <strong
              className={
                metaReady
                  ? "mt-2 block text-2xl text-green-400"
                  : "mt-2 block text-2xl text-yellow-400"
              }
            >
              {metaReady ? "Configurado" : "Pendente"}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Pixel ID</p>
            <strong className="mt-2 block truncate text-2xl text-white">
              {form.metaPixelId || "-"}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Graph API</p>
            <strong className="mt-2 block text-2xl text-white">
              {form.metaGraphVersion || "v21.0"}
            </strong>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-zinc-900 p-6 text-zinc-400">
            Carregando integrações...
          </div>
        ) : (
          <form onSubmit={saveSettings} className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <section className="rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl">
              <h2 className="text-2xl font-black">Meta Pixel</h2>

              <p className="mt-2 rounded-2xl bg-blue-50 p-4 text-sm font-bold leading-relaxed text-blue-800">
                Use esta área como um auxiliar de Pixel. Ela envia um Purchase
                de teste pela Conversions API para confirmar se o token e o
                Pixel ID estão funcionando.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Pixel ID
                  </label>

                  <input
                    className="w-full rounded-xl border border-zinc-300 p-4 font-mono text-sm outline-none focus:border-green-600"
                    placeholder="123456789012345"
                    value={form.metaPixelId || ""}
                    onChange={(event) =>
                      updateForm("metaPixelId", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Access Token da Meta
                  </label>

                  <input
                    className="w-full rounded-xl border border-zinc-300 p-4 font-mono text-sm outline-none focus:border-green-600"
                    placeholder="EAAB..."
                    value={form.metaAccessToken || ""}
                    onChange={(event) =>
                      updateForm("metaAccessToken", event.target.value)
                    }
                  />

                  {form.metaAccessTokenMasked && (
                    <p className="mt-2 text-xs text-zinc-500">
                      Token salvo: {form.metaAccessTokenMasked}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Graph Version
                  </label>

                  <input
                    className="w-full rounded-xl border border-zinc-300 p-4 font-mono text-sm outline-none focus:border-green-600"
                    placeholder="v21.0"
                    value={form.metaGraphVersion || "v21.0"}
                    onChange={(event) =>
                      updateForm("metaGraphVersion", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Código de teste da Meta
                  </label>

                  <input
                    className="w-full rounded-xl border border-zinc-300 p-4 font-mono text-sm outline-none focus:border-green-600"
                    placeholder="TEST12345"
                    value={form.metaTestCode || ""}
                    onChange={(event) =>
                      updateForm("metaTestCode", event.target.value)
                    }
                  />

                  <p className="mt-2 text-xs text-zinc-500">
                    Você pega esse código no Gerenciador de Eventos da Meta, em
                    “Eventos de teste”.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-3xl bg-zinc-900 p-5">
                <h2 className="text-2xl font-black">Teste de evento</h2>

                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  Esse teste envia um evento Purchase fictício para a Meta.
                  Depois, confira no Gerenciador de Eventos se ele apareceu.
                </p>

                {message && (
                  <p className="mt-5 rounded-xl bg-zinc-800 p-3 text-sm font-bold text-green-400">
                    {message}
                  </p>
                )}

                <div className="mt-5 grid gap-3">
                  <button
                    disabled={saving}
                    className="rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : "Salvar integrações"}
                  </button>

                  <button
                    type="button"
                    onClick={testMetaPurchase}
                    disabled={testing || !metaReady}
                    className="rounded-xl bg-blue-700 p-4 font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {testing ? "Testando..." : "🧪 Testar Purchase Meta"}
                  </button>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl">
                <h2 className="text-2xl font-black">Resultado</h2>

                {!testResult ? (
                  <div className="mt-4 rounded-2xl bg-zinc-100 p-4 text-zinc-500">
                    Nenhum teste executado ainda.
                  </div>
                ) : (
                  <pre className="mt-4 max-h-96 overflow-auto rounded-2xl bg-zinc-950 p-4 text-xs text-green-300">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                )}
              </div>
            </section>
          </form>
        )}
      </div>
    </main>
  );
}
