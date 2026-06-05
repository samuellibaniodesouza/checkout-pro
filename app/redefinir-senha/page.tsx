"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function RedefinirSenhaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      router.push("/painel");
      return;
    }

    setMessage(data.error || "Erro ao redefinir senha.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 text-zinc-900 shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-green-700">
          Nova senha
        </p>

        <h1 className="mt-2 text-3xl font-black">Redefinir senha</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            required
            type="password"
            minLength={8}
            className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
            placeholder="Nova senha"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {message && (
            <p className="rounded-xl bg-red-100 p-3 text-sm font-bold text-red-700">
              {message}
            </p>
          )}

          <button className="w-full rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700">
            Salvar nova senha
          </button>
        </form>
      </section>
    </main>
  );
}
