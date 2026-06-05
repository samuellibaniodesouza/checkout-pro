"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hasAdmin, setHasAdmin] = useState(true);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkStatus() {
      const response = await fetch("/api/auth/status");
      const data = await response.json();

      setHasAdmin(data.hasAdmin);

      if (!data.hasAdmin) {
        router.push("/cadastro");
        return;
      }

      if (data.authenticated) {
        router.push("/painel");
        return;
      }

      setLoading(false);
    }

    checkStatus();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (response.ok) {
      router.push("/painel");
      return;
    }

    setMessage(data.error || "Erro ao entrar.");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
        <div className="rounded-3xl bg-zinc-900 p-6 text-zinc-400">
          Carregando...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 text-zinc-900 shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-green-700">
          Painel admin
        </p>

        <h1 className="mt-2 text-3xl font-black">Entrar</h1>

        <p className="mt-2 text-sm text-zinc-600">
          Acesse o painel do seu checkout.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            required
            type="email"
            className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
            placeholder="E-mail"
            value={form.email}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, email: event.target.value }))
            }
          />

          <input
            required
            type="password"
            className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
            placeholder="Senha"
            value={form.password}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, password: event.target.value }))
            }
          />

          {message && (
            <p className="rounded-xl bg-red-100 p-3 text-sm font-bold text-red-700">
              {message}
            </p>
          )}

          <button className="w-full rounded-xl bg-green-600 p-4 font-black text-white hover:bg-green-700">
            Entrar
          </button>
        </form>

        <a
          href="/recuperar-senha"
          className="mt-4 block text-center text-sm font-bold text-green-700"
        >
          Esqueci minha senha
        </a>
      </section>
    </main>
  );
}
