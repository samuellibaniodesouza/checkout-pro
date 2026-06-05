"use client";

import { useEffect, useMemo, useState } from "react";

type Lead = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerCpf?: string | null;
  productName: string;
  productSlug?: string | null;
  status: string;
  source: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

function formatPhoneForWhatsApp(phone?: string | null) {
  if (!phone) return "";

  const numbers = phone.replace(/\D/g, "");

  if (!numbers) return "";

  if (numbers.startsWith("55")) {
    return numbers;
  }

  return `55${numbers}`;
}

function statusLabel(status: string) {
  if (status === "converted") return "Convertido";
  if (status === "contacted") return "Contato feito";
  if (status === "ignored") return "Ignorado";
  return "Abandonado";
}

function statusClass(status: string) {
  if (status === "converted") {
    return "rounded-full bg-green-500/20 px-3 py-1 text-xs font-black text-green-400";
  }

  if (status === "contacted") {
    return "rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black text-blue-400";
  }

  if (status === "ignored") {
    return "rounded-full bg-zinc-700 px-3 py-1 text-xs font-black text-zinc-300";
  }

  return "rounded-full bg-yellow-500/20 px-3 py-1 text-xs font-black text-yellow-400";
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState("");
  const [message, setMessage] = useState("");

  async function loadLeads() {
    setLoading(true);

    const response = await fetch("/api/leads");
    const data = await response.json();

    setLeads(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function updateLeadStatus(leadId: string, status: string) {
    setMessage("");

    const response = await fetch("/api/leads", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leadId,
        status,
      }),
    });

    if (response.ok) {
      setMessage("Lead atualizado com sucesso.");
      await loadLeads();
    } else {
      setMessage("Erro ao atualizar lead.");
    }
  }

  async function sendRecoveryEmail(leadId: string) {
    setSendingId(leadId);
    setMessage("");

    const response = await fetch("/api/leads/send-recovery-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leadId,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage(
        data.skipped
          ? "RESEND_API_KEY não configurado. E-mail não enviado."
          : "E-mail de recuperação enviado com sucesso."
      );
      await loadLeads();
    } else {
      setMessage(data.error || "Erro ao enviar recuperação.");
    }

    setSendingId("");
  }

  async function deleteLead(leadId: string) {
    const confirmDelete = confirm("Remover este lead?");

    if (!confirmDelete) return;

    const response = await fetch("/api/leads", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leadId,
      }),
    });

    if (response.ok) {
      await loadLeads();
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const metrics = useMemo(() => {
    const abandoned = leads.filter((lead) => lead.status === "abandoned").length;
    const contacted = leads.filter((lead) => lead.status === "contacted").length;
    const converted = leads.filter((lead) => lead.status === "converted").length;

    const today = new Date().toLocaleDateString("pt-BR");

    const todayLeads = leads.filter(
      (lead) => new Date(lead.createdAt).toLocaleDateString("pt-BR") === today
    ).length;

    return {
      abandoned,
      contacted,
      converted,
      todayLeads,
    };
  }, [leads]);

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold text-green-400">
              Painel administrativo
            </p>

            <h1 className="mt-2 text-3xl font-black lg:text-4xl">
              Leads abandonados
            </h1>

            <p className="mt-2 max-w-2xl text-zinc-400">
              Pessoas que preencheram o checkout, mas ainda não concluíram a compra.
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
              href="/painel/financeiro"
              className="rounded-xl bg-green-600 px-5 py-3 font-black text-white hover:bg-green-700"
            >
              Financeiro
            </a>
          </div>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Leads hoje</p>
            <strong className="mt-2 block text-3xl text-white">
              {metrics.todayLeads}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Abandonados</p>
            <strong className="mt-2 block text-3xl text-yellow-400">
              {metrics.abandoned}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Contato feito</p>
            <strong className="mt-2 block text-3xl text-blue-400">
              {metrics.contacted}
            </strong>
          </div>

          <div className="rounded-3xl bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">Convertidos</p>
            <strong className="mt-2 block text-3xl text-green-400">
              {metrics.converted}
            </strong>
          </div>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl bg-zinc-900 p-4 text-sm font-bold text-green-400">
            {message}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl bg-zinc-900 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead className="bg-zinc-800 text-zinc-300">
                <tr>
                  <th className="p-4">Lead</th>
                  <th className="p-4">Contato</th>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Data</th>
                  <th className="p-4">Ações</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td className="p-6 text-center text-zinc-400" colSpan={6}>
                      Carregando leads...
                    </td>
                  </tr>
                )}

                {!loading &&
                  leads.map((lead) => {
                    const whatsappPhone = formatPhoneForWhatsApp(
                      lead.customerPhone
                    );

                    const whatsappText = encodeURIComponent(
                      `Olá ${lead.customerName}, vi que você iniciou sua compra do produto "${lead.productName}", mas não finalizou. Seu acesso ainda está reservado. Posso te ajudar a concluir?`
                    );

                    return (
                      <tr
                        key={lead.id}
                        className="border-t border-zinc-800 text-zinc-300"
                      >
                        <td className="p-4">
                          <p className="font-black text-white">
                            {lead.customerName}
                          </p>
                          <p className="mt-1 text-xs text-zinc-500">
                            Origem: {lead.source}
                          </p>
                        </td>

                        <td className="p-4">
                          <p>{lead.customerEmail}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {lead.customerPhone || "Sem telefone"}
                          </p>
                        </td>

                        <td className="p-4">
                          <p className="font-bold text-white">
                            {lead.productName}
                          </p>

                          {lead.productSlug && (
                            <p className="mt-1 text-xs text-zinc-500">
                              /checkout/{lead.productSlug}
                            </p>
                          )}
                        </td>

                        <td className="p-4">
                          <span className={statusClass(lead.status)}>
                            {statusLabel(lead.status)}
                          </span>
                        </td>

                        <td className="p-4">
                          {new Date(lead.createdAt).toLocaleString("pt-BR")}
                        </td>

                        <td className="p-4">
                          <div className="grid min-w-[180px] gap-2">
                            {whatsappPhone && (
                              <a
                                href={`https://wa.me/${whatsappPhone}?text=${whatsappText}`}
                                target="_blank"
                                className="rounded-xl bg-green-600 px-3 py-2 text-center text-xs font-black text-white hover:bg-green-700"
                              >
                                WhatsApp
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => sendRecoveryEmail(lead.id)}
                              disabled={sendingId === lead.id}
                              className="rounded-xl bg-blue-600 px-3 py-2 text-center text-xs font-black text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {sendingId === lead.id
                                ? "Enviando..."
                                : "Enviar recuperação"}
                            </button>

                            <a
                              href={`mailto:${lead.customerEmail}?subject=Sua compra ficou pendente&body=Olá ${lead.customerName}, vi que você iniciou sua compra do produto ${lead.productName}, mas não finalizou. Posso te ajudar?`}
                              className="rounded-xl bg-zinc-700 px-3 py-2 text-center text-xs font-black text-white hover:bg-zinc-600"
                            >
                              E-mail manual
                            </a>

                            <button
                              type="button"
                              onClick={() =>
                                updateLeadStatus(lead.id, "contacted")
                              }
                              className="rounded-xl bg-zinc-700 px-3 py-2 text-center text-xs font-black text-white hover:bg-zinc-600"
                            >
                              Marcar contato
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                updateLeadStatus(lead.id, "converted")
                              }
                              className="rounded-xl bg-purple-700 px-3 py-2 text-center text-xs font-black text-white hover:bg-purple-800"
                            >
                              Converter
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteLead(lead.id)}
                              className="rounded-xl bg-red-600 px-3 py-2 text-center text-xs font-black text-white hover:bg-red-700"
                            >
                              Remover
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {!loading && leads.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-zinc-400" colSpan={6}>
                      Nenhum lead capturado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
