"use client";

import { useEffect, useState } from "react";

type AppSettings = {
  companyName: string;
  supportEmail: string;
  supportWhatsapp: string;
  logoUrl: string;
  footerText: string;
};

const defaultForm: AppSettings = {
  companyName: "Checkout Digital",
  supportEmail: "",
  supportWhatsapp: "",
  logoUrl: "",
  footerText: "Checkout seguro para produtos digitais.",
};

export default function SistemaPage() {
  const [form, setForm] = useState<AppSettings>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [resetMode, setResetMode] = useState<"test-data" | "all-data">(
    "test-data"
  );
  const [confirmation, setConfirmation] = useState("");
  const [resetting, setResetting] = useState(false);

  const [message, setMessage] = useState("");
  const [resetResult, setResetResult] = useState<any>(null);

  async function loadSettings() {
    setLoading(true);

    const response = await fetch("/api/app-settings");
    const data = await response.json();

    if (response.ok) {
      setForm({
        ...defaultForm,
        ...data,
      });
    }

    setLoading(false);
  }

  function updateForm(field: keyof AppSettings, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setResetResult(null);

    const response = await fetch("/api/app-settings", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("Configurações gerais salvas com sucesso.");
      setForm({
        ...form,
        ...data,
      });
    } else {
      setMessage(data.error || "Erro ao salvar configurações.");
    }

    setSaving(false);
  }

  async function resetSystem() {
    const firstConfirm = confirm(
      resetMode === "all-data"
        ? "ATENÇÃO: isso vai apagar produtos, pedidos, leads, cupons, gastos, templates e configurações. Continuar?"
        : "Isso vai apagar pedidos, leads e gastos de teste. Continuar?"
    );

    if (!firstConfirm) return;

    setResetting(true);
    setMessage("");
    setResetResult(null);

    const response = await fetch("/api/system/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        mode: resetMode,
        confirmation,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage(data.message || "Sistema zerado com sucesso.");
      setResetResult(data);
      setConfirmation("");
    } else {
      setMessage(data.error || "Erro ao zerar sistema.");
      setResetResult(data);
    }

    setResetting(false);
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
              Sistema
            </h1>

            <p className="mt-2 max-w-2xl text-zinc-400">
              Configurações gerais e ferramentas de manutenção do banco.
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

            <a
              href="/painel/integracoes"
              className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800"
            >
              Integrações
            </a>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-zinc-900 p-6 text-zinc-400">
            Carregando sistema...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <form
              onSubmit={saveSettings}
              className="rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl"
            >
              <h2 className="text-2xl font-black">Configurações gerais</h2>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Nome da empresa / projeto
                  </label>

                  <input
                    className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    value={form.companyName}
                    onChange={(event) =>
                      updateForm("companyName", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    E-mail de suporte
                  </label>

                  <input
                    type="email"
                    className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    placeholder="suporte@seudominio.com"
                    value={form.supportEmail || ""}
                    onChange={(event) =>
                      updateForm("supportEmail", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    WhatsApp suporte
                  </label>

                  <input
                    className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    placeholder="11999999999"
                    value={form.supportWhatsapp || ""}
                    onChange={(event) =>
                      updateForm("supportWhatsapp", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Logo URL
                  </label>

                  <input
                    className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    placeholder="https://..."
                    value={form.logoUrl || ""}
                    onChange={(event) =>
                      updateForm("logoUrl", event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">
                    Texto de rodapé
                  </label>

                  <textarea
                    className="h-24 w-full resize-none rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    value={form.footerText || ""}
                    onChange={(event) =>
                      updateForm("footerText", event.target.value)
                    }
                  />
                </div>
              </div>

              <button
                disabled={saving}
                className="mt-5 w-full rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar configurações gerais"}
              </button>
            </form>

            <section className="space-y-6">
              <div className="rounded-3xl border-2 border-red-500 bg-red-950/40 p-5 shadow-2xl">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-red-300">
                  Zona de perigo
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  Apagar dados do sistema
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-red-100">
                  Use isso antes de colocar o sistema em produção, para apagar
                  registros de teste e começar limpo. Essa ação não tem volta.
                </p>

                <div className="mt-5 space-y-3">
                  <label className="block cursor-pointer rounded-2xl bg-black/30 p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        checked={resetMode === "test-data"}
                        onChange={() => setResetMode("test-data")}
                      />

                      <div>
                        <p className="font-black text-white">
                          Apagar apenas dados de teste
                        </p>
                        <p className="mt-1 text-sm text-red-100/80">
                          Remove pedidos, leads e gastos. Mantém produtos,
                          cupons, configurações, templates e integrações.
                        </p>
                      </div>
                    </div>
                  </label>

                  <label className="block cursor-pointer rounded-2xl bg-black/30 p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        checked={resetMode === "all-data"}
                        onChange={() => setResetMode("all-data")}
                      />

                      <div>
                        <p className="font-black text-white">
                          Zerar banco inteiro
                        </p>
                        <p className="mt-1 text-sm text-red-100/80">
                          Remove pedidos, leads, gastos, cupons, produtos,
                          arquivos, templates e configurações.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="mt-5">
                  <label className="mb-2 block text-sm font-bold text-red-100">
                    Para confirmar, digite ZERAR
                  </label>

                  <input
                    className="w-full rounded-xl border border-red-400 bg-black/30 p-4 font-black text-white outline-none focus:border-white"
                    placeholder="ZERAR"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={resetSystem}
                  disabled={resetting || confirmation !== "ZERAR"}
                  className="mt-5 w-full rounded-xl bg-red-600 p-4 font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resetting
                    ? "Apagando..."
                    : resetMode === "all-data"
                    ? "Zerar banco inteiro"
                    : "Apagar dados de teste"}
                </button>
              </div>

              <div className="rounded-3xl bg-zinc-900 p-5">
                <h2 className="text-2xl font-black">Resultado</h2>

                {message ? (
                  <p className="mt-4 rounded-2xl bg-zinc-800 p-4 text-sm font-bold text-green-400">
                    {message}
                  </p>
                ) : (
                  <p className="mt-4 rounded-2xl bg-zinc-800 p-4 text-sm text-zinc-400">
                    Nenhuma ação executada ainda.
                  </p>
                )}

                {resetResult && (
                  <pre className="mt-4 max-h-80 overflow-auto rounded-2xl bg-black p-4 text-xs text-green-300">
                    {JSON.stringify(resetResult, null, 2)}
                  </pre>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
