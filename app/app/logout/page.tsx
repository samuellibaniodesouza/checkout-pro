"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function logout() {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      router.push("/login");
    }

    logout();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 text-white">
      <div className="rounded-3xl bg-zinc-900 p-6 text-zinc-400">
        Saindo...
      </div>
    </main>
  );
}
