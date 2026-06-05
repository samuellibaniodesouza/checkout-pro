"use client";

import { useEffect, useState } from "react";

type ProductFile = {
  id: string;
  title: string;
  fileUrl: string;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  fileUrl: string | null;
  isActive: boolean;
  files: ProductFile[];
};

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");

  async function loadProducts() {
    const response = await fetch("/api/products");
    const data = await response.json();

    setProducts(data);
    setLoading(false);
  }

  async function deleteProduct(productId: string) {
    const confirmDelete = confirm(
      "Tem certeza que deseja excluir este produto? Essa ação não pode ser desfeita."
    );

    if (!confirmDelete) {
      return;
    }

    setDeletingId(productId);

    const response = await fetch("/api/products", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId,
      }),
    });

    if (response.ok) {
      await loadProducts();
    } else {
      alert("Erro ao excluir produto.");
    }

    setDeletingId("");
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold text-green-400">
              Painel administrativo
            </p>
            <h1 className="mt-2 text-3xl font-black">Produtos</h1>
            <p className="mt-2 text-zinc-400">
              Gerencie os produtos digitais da sua plataforma.
            </p>
          </div>

          <a
            href="/painel/produtos/criar"
            className="rounded-xl bg-green-600 px-5 py-3 text-center font-black text-white hover:bg-green-700"
          >
            Criar novo produto
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] border-collapse text-left text-sm">
              <thead className="bg-zinc-800 text-zinc-300">
                <tr>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4">Preço</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Arquivos</th>
                  <th className="p-4">Checkout</th>
                  <th className="p-4">Ações</th>
                </tr>
              </thead>

              <tbody>
                {loading && (
                  <tr>
                    <td className="p-6 text-center text-zinc-400" colSpan={7}>
                      Carregando produtos...
                    </td>
                  </tr>
                )}

                {!loading &&
                  products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-t border-zinc-800 text-zinc-300"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-14 w-14 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800 text-xs text-zinc-500">
                              Sem capa
                            </div>
                          )}

                          <div>
                            <p className="font-bold text-white">
                              {product.name}
                            </p>
                            <p className="mt-1 max-w-md text-xs text-zinc-500">
                              {product.description || "Sem descrição"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">/checkout/{product.slug}</td>

                      <td className="p-4">
                        R$ {product.price.toFixed(2).replace(".", ",")}
                      </td>

                      <td className="p-4">
                        <span
                          className={
                            product.isActive
                              ? "rounded-full bg-green-500/20 px-3 py-1 text-xs font-bold text-green-400"
                              : "rounded-full bg-red-500/20 px-3 py-1 text-xs font-bold text-red-400"
                          }
                        >
                          {product.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      <td className="p-4">
                        {product.files?.length || 0} arquivo(s)
                      </td>

                      <td className="p-4">
                        <a
                          href={`/checkout/${product.slug}`}
                          className="font-bold text-green-400 hover:text-green-300"
                        >
                          Abrir checkout
                        </a>
                      </td>

                      <td className="p-4">
                        <div className="flex gap-2">
                          <a
                            href={`/painel/produtos/editar/${product.id}`}
                            className="rounded-xl bg-zinc-700 px-4 py-2 text-xs font-black text-white hover:bg-zinc-600"
                          >
                            Editar
                          </a>

                          <button
                            onClick={() => deleteProduct(product.id)}
                            disabled={deletingId === product.id}
                            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === product.id
                              ? "Excluindo..."
                              : "Excluir"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && products.length === 0 && (
                  <tr>
                    <td className="p-6 text-center text-zinc-400" colSpan={7}>
                      Nenhum produto cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <a
            href="/painel/pedidos"
            className="rounded-xl bg-zinc-800 px-5 py-3 font-bold text-white hover:bg-zinc-700"
          >
            Ver pedidos
          </a>

          <a
            href="/"
            className="rounded-xl bg-green-600 px-5 py-3 font-black text-white hover:bg-green-700"
          >
            Voltar ao checkout
          </a>
        </div>
      </div>
    </main>
  );
}