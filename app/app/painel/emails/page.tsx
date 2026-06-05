"use client";

import { useEffect, useMemo, useState } from "react";

type EmailTemplate = {
  id: string;
  key: string;
  name: string;
  subject: string;
  headline: string;
  body: string;
  buttonText: string;
  footer: string | null;
  isActive: boolean;
};

export default function EmailsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [message, setMessage] = useState("");

  const selectedTemplate = useMemo(() => {
    return templates.find((template) => template.id === selectedId) || null;
  }, [templates, selectedId]);

  async function loadTemplates() {
    setLoading(true);

    const response = await fetch("/api/email-templates");
    const data = await response.json();

    if (Array.isArray(data)) {
      setTemplates(data);
      setSelectedId((current) => current || data[0]?.id || "");
    }

    setLoading(false);
  }

  function updateSelected(field: keyof EmailTemplate, value: string | boolean) {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === selectedId
          ? {
              ...template,
              [field]: value,
            }
          : template
      )
    );
  }

  async function saveTemplate() {
    if (!selectedTemplate) return;

    setSaving(true);
    setMessage("");

    const response = await fetch("/api/email-templates", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateId: selectedTemplate.id,
        name: selectedTemplate.name,
        subject: selectedTemplate.subject,
        headline: selectedTemplate.headline,
        body: selectedTemplate.body,
        buttonText: selectedTemplate.buttonText,
        footer: selectedTemplate.footer,
        isActive: selectedTemplate.isActive,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("Template salvo com sucesso.");
      await loadTemplates();
      setSelectedId(data.id);
    } else {
      setMessage(data.error || "Erro ao salvar template.");
    }

    setSaving(false);
  }

  async function sendTest() {
    if (!selectedTemplate) return;

    setSendingTest(true);
    setMessage("");

    const response = await fetch("/api/email-templates/send-test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateId: selectedTemplate.id,
        to: testEmail,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage(
        data.skipped
          ? "RESEND_API_KEY não configurado. E-mail não enviado."
          : "E-mail de teste enviado."
      );
    } else {
      setMessage(data.error || "Erro ao enviar teste.");
    }

    setSendingTest(false);
  }

  useEffect(() => {
    loadTemplates();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-green-400">
              Painel administrativo
            </p>

            <h1 className="mt-2 text-3xl font-black lg:text-4xl">
              Central de e-mails
            </h1>

            <p className="mt-2 max-w-2xl text-zinc-400">
              Edite os textos dos e-mails automáticos, recuperação de leads,
              acesso liberado e ofertas complementares.
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
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <section className="rounded-3xl bg-zinc-900 p-5 shadow-2xl">
            <h2 className="text-2xl font-black">Templates</h2>

            {loading ? (
              <div className="mt-4 rounded-2xl bg-zinc-800 p-4 text-zinc-400">
                Carregando templates...
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedId(template.id)}
                    className={
                      selectedId === template.id
                        ? "w-full rounded-2xl border border-green-500 bg-green-500/10 p-4 text-left"
                        : "w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left hover:bg-zinc-800"
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{template.name}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {template.key}
                        </p>
                      </div>

                      <span
                        className={
                          template.isActive
                            ? "rounded-full bg-green-500/20 px-3 py-1 text-xs font-black text-green-400"
                            : "rounded-full bg-red-500/20 px-3 py-1 text-xs font-black text-red-400"
                        }
                      >
                        {template.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 rounded-2xl bg-zinc-950 p-4 text-sm text-zinc-400">
              Variáveis disponíveis:
              <div className="mt-3 grid gap-2 font-mono text-xs">
                <code>{"{{customerName}}"}</code>
                <code>{"{{productName}}"}</code>
                <code>{"{{accessUrl}}"}</code>
                <code>{"{{checkoutUrl}}"}</code>
                <code>{"{{offerUrl}}"}</code>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-5 text-zinc-900 shadow-2xl">
            {!selectedTemplate ? (
              <div className="rounded-2xl bg-zinc-100 p-5 text-zinc-500">
                Selecione um template.
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black">
                      Editar: {selectedTemplate.name}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      Chave interna: {selectedTemplate.key}
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-zinc-100 px-4 py-3 text-sm font-black">
                    <input
                      type="checkbox"
                      checked={selectedTemplate.isActive}
                      onChange={(event) =>
                        updateSelected("isActive", event.target.checked)
                      }
                    />
                    Ativo
                  </label>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Nome interno
                    </label>
                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={selectedTemplate.name}
                      onChange={(event) =>
                        updateSelected("name", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Assunto do e-mail
                    </label>
                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={selectedTemplate.subject}
                      onChange={(event) =>
                        updateSelected("subject", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Título do e-mail
                    </label>
                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={selectedTemplate.headline}
                      onChange={(event) =>
                        updateSelected("headline", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Corpo do e-mail
                    </label>
                    <textarea
                      className="h-32 w-full resize-none rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={selectedTemplate.body}
                      onChange={(event) =>
                        updateSelected("body", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Texto do botão
                    </label>
                    <input
                      className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={selectedTemplate.buttonText}
                      onChange={(event) =>
                        updateSelected("buttonText", event.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">
                      Rodapé
                    </label>
                    <textarea
                      className="h-24 w-full resize-none rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      value={selectedTemplate.footer || ""}
                      onChange={(event) =>
                        updateSelected("footer", event.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-3xl bg-zinc-100 p-5">
                  <p className="text-sm font-black text-zinc-500">
                    Prévia rápida
                  </p>

                  <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
                    <h3 className="text-2xl font-black">
                      {selectedTemplate.headline}
                    </h3>

                    <p className="mt-3 leading-relaxed text-zinc-600">
                      {selectedTemplate.body}
                    </p>

                    <button
                      type="button"
                      className="mt-5 rounded-xl bg-green-600 px-5 py-3 font-black text-white"
                    >
                      {selectedTemplate.buttonText}
                    </button>

                    {selectedTemplate.footer && (
                      <p className="mt-5 border-t border-zinc-200 pt-4 text-xs text-zinc-400">
                        {selectedTemplate.footer}
                      </p>
                    )}
                  </div>
                </div>

                {message && (
                  <div className="mt-5 rounded-2xl bg-zinc-100 p-4 text-sm font-bold text-zinc-700">
                    {message}
                  </div>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={saveTemplate}
                    disabled={saving}
                    className="rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : "Salvar template"}
                  </button>

                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      type="email"
                      className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                      placeholder="email@teste.com"
                      value={testEmail}
                      onChange={(event) => setTestEmail(event.target.value)}
                    />

                    <button
                      type="button"
                      onClick={sendTest}
                      disabled={sendingTest || !testEmail}
                      className="rounded-xl bg-zinc-900 px-5 py-3 font-black text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {sendingTest ? "Enviando..." : "Enviar teste"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
