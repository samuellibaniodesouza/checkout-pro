"use client";

import { useState } from "react";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [devUrl, setDevUrl] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setDevUrl("");

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    setMessage(data.message || data.error || "Solicitação enviada.");

    if (data.devResetUrl) {
      setDevUrl(data.devResetUrl);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 text-zinc-900 shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-green-700">
          Recuperação
        </p>

        <h1 className="mt-2 text-3xl font-black">Esqueci minha senha</h1>

        <p className="mt-2 text-sm text-zinc-600">
          Informe seu e-mail para receber o link de redefinição.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            required
            type="email"
            className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
            placeholder="E-mail"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <button className="w-full rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700">
            Enviar recuperação
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-xl bg-zinc-100 p-3 text-sm font-bold text-zinc-700">
            {message}
          </p>
        )}

        {devUrl && (
          <a
            href={devUrl}
            className="mt-4 block break-all rounded-xl bg-yellow-50 p-3 text-xs font-bold text-yellow-800"
          >
            Link local: {devUrl}
          </a>
        )}

        <a href="/login" className="mt-4 block text-center text-sm font-bold text-green-700">
          Voltar ao login
        </a>
      </section>
    </main>
  );
}
