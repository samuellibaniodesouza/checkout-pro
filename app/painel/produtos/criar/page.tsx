"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProductFileForm = {
  title: string;
  fileUrl: string;
};

export default function CriarProdutoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingFileIndex, setUploadingFileIndex] = useState<number | null>(
    null
  );
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    price: "",
    description: "",
    imageUrl: "",
    metaPixelId: "",
  });

  const [files, setFiles] = useState<ProductFileForm[]>([
    {
      title: "",
      fileUrl: "",
    },
  ]);

  function updateForm(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateFile(index: number, field: keyof ProductFileForm, value: string) {
    setFiles((prev) =>
      prev.map((file, fileIndex) =>
        fileIndex === index
          ? {
              ...file,
              [field]: value,
            }
          : file
      )
    );
  }

  function addFile() {
    setFiles((prev) => [
      ...prev,
      {
        title: "",
        fileUrl: "",
      },
    ]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
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

  async function uploadProductFile(file: File, index: number) {
    setUploadingFileIndex(index);
    setMessage("");

    const uploadData = new FormData();
    uploadData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: uploadData,
    });

    const data = await response.json();

    if (response.ok) {
      updateFile(index, "fileUrl", data.url);

      if (!files[index].title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        updateFile(index, "title", cleanName);
      }
    } else {
      setMessage(data.error || "Erro ao enviar arquivo.");
    }

    setUploadingFileIndex(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const validFiles = files.filter((file) => file.title && file.fileUrl);

    if (validFiles.length === 0) {
      setMessage("Adicione pelo menos um arquivo do produto.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        files: validFiles.map((file, index) => ({
          title: file.title,
          fileUrl: file.fileUrl,
          sortOrder: index + 1,
        })),
      }),
    });

    if (response.ok) {
      router.push("/painel/produtos");
      return;
    }

    const data = await response.json();

    setMessage(data.error || "Erro ao criar produto.");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-bold text-green-400">
            Painel administrativo
          </p>

          <h1 className="mt-2 text-3xl font-black">Criar produto</h1>

          <p className="mt-2 text-zinc-400">
            Cadastre um produto digital com capa, Meta Pixel e quantos arquivos quiser.
          </p>
        </div>

        <section className="rounded-3xl bg-white p-6 text-zinc-900 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-bold">
                Nome do produto
              </label>
              <input
                required
                className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                placeholder="Ex: Produtos Naturais Caseiros"
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
                placeholder="ex: produtos-naturais-caseiros"
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
                placeholder="47.90"
                value={form.price}
                onChange={(event) => updateForm("price", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">Descrição</label>
              <textarea
                className="h-32 w-full resize-none rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                placeholder="Descreva o produto digital..."
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

              <input
                className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                placeholder="Ex: 123456789012345"
                value={form.metaPixelId}
                onChange={(event) =>
                  updateForm("metaPixelId", event.target.value)
                }
              />

              <p className="mt-2 text-xs text-zinc-500">
                Pixel específico deste produto. O evento Purchase será usado depois, somente após pagamento aprovado.
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
                    Prévia da capa
                  </p>
                  <img
                    src={form.imageUrl}
                    alt="Prévia da capa do produto"
                    className="h-56 w-full rounded-xl object-cover"
                  />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-zinc-900">
                    Arquivos do produto
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Adicione ebooks, bônus, checklists, planilhas ou arquivos ZIP.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addFile}
                  className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-black text-white hover:bg-zinc-800"
                >
                  + Adicionar
                </button>
              </div>

              <div className="space-y-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <p className="font-black text-zinc-900">
                        Arquivo {index + 1}
                      </p>

                      {files.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="rounded-lg bg-red-100 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-200"
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="mb-2 block text-sm font-bold">
                          Nome que aparecerá para o cliente
                        </label>
                        <input
                          className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                          placeholder="Ex: Ebook Principal, Receitas Bônus, Checklist..."
                          value={file.title}
                          onChange={(event) =>
                            updateFile(index, "title", event.target.value)
                          }
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-bold">
                          Arquivo
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.zip,.doc,.docx,.xlsx,.xls"
                          className="w-full rounded-xl border border-zinc-300 p-4"
                          onChange={(event) => {
                            const selectedFile = event.target.files?.[0];

                            if (selectedFile) {
                              uploadProductFile(selectedFile, index);
                            }
                          }}
                        />

                        {uploadingFileIndex === index && (
                          <p className="mt-2 text-sm font-bold text-green-700">
                            Enviando arquivo...
                          </p>
                        )}

                        {file.fileUrl && (
                          <p className="mt-2 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">
                            Arquivo enviado: {file.fileUrl}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {message && (
              <p className="rounded-xl bg-red-100 p-3 text-center text-sm font-bold text-red-700">
                {message}
              </p>
            )}

            <button
              disabled={
                loading || uploadingImage || uploadingFileIndex !== null
              }
              className="w-full rounded-xl bg-green-600 p-4 text-lg font-black text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Salvar produto"}
            </button>
          </form>
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
