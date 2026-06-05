"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CadastroPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkStatus() {
      const response = await fetch("/api/auth/status");
      const data = await response.json();

      if (data.hasAdmin) {
        router.push("/login");
        return;
      }

      setChecking(false);
    }

    checkStatus();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");

    const response = await fetch("/api/auth/register", {
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

    setMessage(data.error || "Erro ao criar administrador.");
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
        <div className="rounded-3xl bg-zinc-900 p-6 text-zinc-400">
          Verificando primeiro acesso...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 text-zinc-900 shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-green-700">
          Primeiro acesso
        </p>

        <h1 className="mt-2 text-3xl font-black">Criar administrador</h1>

        <p className="mt-2 text-sm text-zinc-600">
          Cadastre o primeiro usuário do painel. Depois disso, novos cadastros
          ficam bloqueados.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            required
            className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
            placeholder="Nome"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />

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
            minLength={8}
            className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
            placeholder="Senha com no mínimo 8 caracteres"
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
            Criar administrador
          </button>
        </form>
      </section>
    </main>
  );
}
