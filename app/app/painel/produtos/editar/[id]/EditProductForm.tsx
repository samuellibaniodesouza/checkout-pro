"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProductFile = {
  id: string;
  title: string;
  fileUrl: string;
  sortOrder: number;
};

type UpsellOptionProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  metaPixelId: string | null;
  upsellHeadline: string | null;
  upsellBenefits: string | null;
  isActive: boolean;
  upsellEnabled: boolean;
  upsellProductId: string | null;
  files: ProductFile[];
};

type EditProductFormProps = {
  product: Product;
  allProducts: UpsellOptionProduct[];
};

export default function EditProductForm({
  product,
  allProducts,
}: EditProductFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingNewFile, setUploadingNewFile] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: product.name,
    slug: product.slug,
    price: String(product.price),
    description: product.description || "",
    imageUrl: product.imageUrl || "",
    metaPixelId: product.metaPixelId || "",
    upsellHeadline: product.upsellHeadline || "",
    upsellBenefits: product.upsellBenefits || "",
    isActive: product.isActive,
    upsellEnabled: product.upsellEnabled,
    upsellProductId: product.upsellProductId || "",
  });

  const [files, setFiles] = useState<ProductFile[]>(product.files);

  const [newFile, setNewFile] = useState({
    title: "",
    fileUrl: "",
  });

  function updateForm(field: string, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateFileTitle(fileId: string, title: string) {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              title,
            }
          : file,
      ),
    );
  }

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }

  async function uploadCover(file: File) {
    setUploadingImage(true);
    setMessage("");

    const uploadData = new FormData();
    uploadData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: uploadData,
    });

    const data = await response.json();

    if (response.ok) {
      updateForm("imageUrl", data.url);
    } else {
      setMessage(data.error || "Erro ao enviar capa.");
    }

    setUploadingImage(false);
  }

  async function uploadNewProductFile(file: File) {
    setUploadingNewFile(true);
    setMessage("");

    const uploadData = new FormData();
    uploadData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: uploadData,
    });

    const data = await response.json();

    if (response.ok) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");

      setNewFile({
        title: newFile.title || cleanName,
        fileUrl: data.url,
      });
    } else {
      setMessage(data.error || "Erro ao enviar arquivo.");
    }

    setUploadingNewFile(false);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    if (form.upsellEnabled && !form.upsellProductId) {
      setMessage("Selecione um produto de upsell ou desative o upsell.");
      setLoading(false);
      return;
    }

    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        upsellProductId: form.upsellEnabled ? form.upsellProductId : "",
      }),
    });

    if (response.ok) {
      router.push("/painel/produtos");
      return;
    }

    const data = await response.json();

    setMessage(data.error || "Erro ao atualizar produto.");
    setLoading(false);
  }

  async function saveFileTitle(file: ProductFile) {
    setMessage("");

    const response = await fetch("/api/product-files", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileId: file.id,
        title: file.title,
      }),
    });

    if (response.ok) {
      setMessage("Arquivo atualizado com sucesso.");
      return;
    }

    const data = await response.json();
    setMessage(data.error || "Erro ao atualizar arquivo.");
  }

  async function addNewFile() {
    setMessage("");

    if (!newFile.title || !newFile.fileUrl) {
      setMessage("Informe o nome e envie o arquivo antes de adicionar.");
      return;
    }

    const response = await fetch("/api/product-files", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: product.id,
        title: newFile.title,
        fileUrl: newFile.fileUrl,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setFiles((prev) => [
        ...prev,
        {
          id: data.id,
          title: data.title,
          fileUrl: data.fileUrl,
          sortOrder: data.sortOrder,
        },
      ]);

      setNewFile({
        title: "",
        fileUrl: "",
      });

      setMessage("Arquivo adicionado com sucesso.");
      return;
    }

    setMessage(data.error || "Erro ao adicionar arquivo.");
  }

  async function removeFile(fileId: string) {
    const confirmRemove = confirm(
      "Tem certeza que deseja remover este arquivo do produto?",
    );

    if (!confirmRemove) {
      return;
    }

    setMessage("");

    const response = await fetch("/api/product-files", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileId,
      }),
    });

    if (response.ok) {
      setFiles((prev) => prev.filter((file) => file.id !== fileId));
      setMessage("Arquivo removido com sucesso.");
      return;
    }

    const data = await response.json();
    setMessage(data.error || "Erro ao remover arquivo.");
  }

  const selectedUpsellProduct = allProducts.find(
    (item) => item.id === form.upsellProductId,
  );

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-bold text-green-400">
            Painel administrativo
          </p>

          <h1 className="mt-2 text-3xl font-black">Editar produto</h1>

          <p className="mt-2 text-zinc-400">
            Altere os dados principais, Meta Pixel, Upsell e arquivos do
            produto.
          </p>
        </div>

        <section className="rounded-3xl bg-white p-6 text-zinc-900 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold">
                Nome do produto
              </label>
              <input
                required
                className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                value={form.name}
                onChange={(event) => {
                  const name = event.target.value;
                  updateForm("name", name);
                  updateForm("slug", generateSlug(name));
                }}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Slug do checkout
              </label>
              <input
                required
                className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                value={form.slug}
                onChange={(event) =>
                  updateForm("slug", generateSlug(event.target.value))
                }
              />
              <p className="mt-2 text-xs text-zinc-500">
                O checkout ficará em: /checkout/{form.slug || "seu-produto"}
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">Preço</label>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                value={form.price}
                onChange={(event) => updateForm("price", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">Descrição</label>
              <textarea
                className="h-32 w-full resize-none rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">
                Meta Pixel ID
              </label>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Headline do Upsell
                </label>

                <input
                  className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                  placeholder="Ex: Aprenda a criar perfumes irresistíveis"
                  value={form.upsellHeadline}
                  onChange={(event) =>
                    updateForm("upsellHeadline", event.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Benefícios do Upsell
                </label>

                <textarea
                  className="h-32 w-full resize-none rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                  placeholder={`Perfumes quentes
Perfumes de pele
Fixação prolongada
Combinações exclusivas`}
                  value={form.upsellBenefits}
                  onChange={(event) =>
                    updateForm("upsellBenefits", event.target.value)
                  }
                />

                <p className="mt-2 text-xs text-zinc-500">
                  Digite um benefício por linha.
                </p>
              </div>

              <input
                className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                placeholder="Ex: 123456789012345"
                value={form.metaPixelId}
                onChange={(event) =>
                  updateForm("metaPixelId", event.target.value)
                }
              />

              <p className="mt-2 text-xs text-zinc-500">
                Pixel específico deste produto.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <label className="mb-2 block text-sm font-bold">
                Capa do produto
              </label>

              <input
                type="file"
                accept="image/*"
                className="w-full rounded-xl border border-zinc-300 bg-white p-4"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    uploadCover(file);
                  }
                }}
              />

              {uploadingImage && (
                <p className="mt-2 text-sm font-bold text-green-700">
                  Enviando capa...
                </p>
              )}

              {form.imageUrl && (
                <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
                  <p className="mb-3 text-sm font-bold text-zinc-700">
                    Capa atual
                  </p>
                  <img
                    src={form.imageUrl}
                    alt="Capa do produto"
                    className="h-56 w-full rounded-xl object-cover"
                  />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-purple-900">
                    Upsell de 1 clique
                  </p>
                  <p className="mt-1 text-xs text-purple-700">
                    Após a compra do produto principal, ofereça outro produto
                    complementar.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm font-bold text-purple-900">
                  <input
                    type="checkbox"
                    checked={form.upsellEnabled}
                    onChange={(event) => {
                      updateForm("upsellEnabled", event.target.checked);

                      if (!event.target.checked) {
                        updateForm("upsellProductId", "");
                      }
                    }}
                  />
                  Ativar
                </label>
              </div>

              {form.upsellEnabled && (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-bold text-purple-900">
                    Produto oferecido no upsell
                  </label>

                  <select
                    className="w-full rounded-xl border border-purple-200 bg-white p-4 outline-none focus:border-purple-600"
                    value={form.upsellProductId}
                    onChange={(event) =>
                      updateForm("upsellProductId", event.target.value)
                    }
                  >
                    <option value="">Selecione um produto...</option>

                    {allProducts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} — R${" "}
                        {item.price.toFixed(2).replace(".", ",")}
                      </option>
                    ))}
                  </select>

                  {allProducts.length === 0 && (
                    <p className="mt-2 text-xs font-bold text-red-600">
                      Cadastre outro produto ativo para poder usar como upsell.
                    </p>
                  )}

                  {selectedUpsellProduct && (
                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-purple-200 bg-white p-4">
                      {selectedUpsellProduct.imageUrl ? (
                        <img
                          src={selectedUpsellProduct.imageUrl}
                          alt={selectedUpsellProduct.name}
                          className="h-16 w-16 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-100 text-xs text-zinc-400">
                          Sem capa
                        </div>
                      )}

                      <div>
                        <p className="font-black text-zinc-900">
                          {selectedUpsellProduct.name}
                        </p>
                        <p className="mt-1 text-sm font-bold text-green-700">
                          R${" "}
                          {selectedUpsellProduct.price
                            .toFixed(2)
                            .replace(".", ",")}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          /checkout/{selectedUpsellProduct.slug}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  updateForm("isActive", event.target.checked)
                }
              />
              <span className="font-bold">Produto ativo</span>
            </label>

            {message && (
              <p className="rounded-xl bg-zinc-100 p-3 text-center text-sm font-bold text-zinc-700">
                {message}
              </p>
            )}

            <button
              disabled={loading || uploadingImage}
              className="w-full rounded-xl bg-green-600 p-4 text-lg font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar dados do produto"}
            </button>
          </form>

          <div className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-lg font-black text-zinc-900">
              Arquivos do produto
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Edite nomes, adicione novos arquivos ou remova arquivos
              existentes.
            </p>

            <div className="mt-5 space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4"
                >
                  <label className="mb-2 block text-sm font-bold">
                    Nome que aparece para o cliente
                  </label>

                  <input
                    className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    value={file.title}
                    onChange={(event) =>
                      updateFileTitle(file.id, event.target.value)
                    }
                  />

                  <p className="mt-2 break-all text-xs text-zinc-500">
                    {file.fileUrl}
                  </p>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => saveFileTitle(file)}
                      className="rounded-xl bg-green-600 px-4 py-3 text-sm font-black text-white hover:bg-green-700"
                    >
                      Salvar nome
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white hover:bg-red-700"
                    >
                      Remover arquivo
                    </button>
                  </div>
                </div>
              ))}

              {files.length === 0 && (
                <p className="rounded-2xl bg-white p-4 text-zinc-500">
                  Nenhum arquivo cadastrado.
                </p>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-white p-4">
              <p className="font-black text-zinc-900">Adicionar novo arquivo</p>

              <div className="mt-4 space-y-3">
                <input
                  className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                  placeholder="Nome do arquivo para o cliente"
                  value={newFile.title}
                  onChange={(event) =>
                    setNewFile((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                />

                <input
                  type="file"
                  accept=".pdf,.zip,.doc,.docx,.xlsx,.xls"
                  className="w-full rounded-xl border border-zinc-300 p-4"
                  onChange={(event) => {
                    const selectedFile = event.target.files?.[0];

                    if (selectedFile) {
                      uploadNewProductFile(selectedFile);
                    }
                  }}
                />

                {uploadingNewFile && (
                  <p className="text-sm font-bold text-green-700">
                    Enviando novo arquivo...
                  </p>
                )}

                {newFile.fileUrl && (
                  <p className="rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">
                    Arquivo enviado: {newFile.fileUrl}
                  </p>
                )}

                <button
                  type="button"
                  onClick={addNewFile}
                  disabled={uploadingNewFile}
                  className="w-full rounded-xl bg-zinc-900 p-4 font-black text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Adicionar arquivo ao produto
                </button>
              </div>
            </div>
          </div>
        </section>

        <a
          href="/painel/produtos"
          className="mt-6 inline-block rounded-xl bg-zinc-800 px-5 py-3 font-bold text-white hover:bg-zinc-700"
        >
          Voltar para produtos
        </a>
      </div>
    </main>
  );
}
