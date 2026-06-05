import LiveViewerBadge from "@/app/components/LiveViewerBadge";
import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";

type DownloadPageProps = {
  params: Promise<{
    orderId: string;
  }>;
};

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

function isPublicText(value?: string | null) {
  if (!value) return false;

  const cleaned = value.trim();

  if (!cleaned) return false;

  if (/^\d{10,}$/.test(cleaned)) return false;

  return true;
}

function getFileCategory(index: number) {
  if (index === 0) return "Produto principal";
  if (index <= 2) return "Módulo";
  return "Bônus";
}

export default async function AreaDeDownloadPage({
  params,
}: DownloadPageProps) {
  const { orderId } = await params;

  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      product: {
        include: {
          upsellProduct: true,
          files: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
    },
  });

  if (!order || !order.product) {
    notFound();
  }

  const isPaid = order.paymentStatus === "paid";
  const upsellProduct = order.product.upsellProduct;
  const showUpsell =
    isPaid &&
    !order.isUpsellOrder &&
    order.product.upsellEnabled &&
    Boolean(upsellProduct);

  const upsellHeadline = isPublicText(upsellProduct?.upsellHeadline)
    ? upsellProduct?.upsellHeadline?.trim()
    : null;

  const upsellBenefits =
    upsellProduct?.upsellBenefits
      ?.split("\n")
      .map((benefit) => benefit.trim())
      .filter(Boolean)
      .filter((benefit) => !/^\d{10,}$/.test(benefit)) || [];

  const oldUpsellPrice = upsellProduct ? upsellProduct.price * 2 : 0;
  const purchaseDate = new Date(order.createdAt).toLocaleString("pt-BR");

  const principalFiles = order.product.files.filter((_, index) => index === 0);
  const moduleFiles = order.product.files.filter(
    (_, index) => index > 0 && index <= 2
  );
  const bonusFiles = order.product.files.filter((_, index) => index > 2);

  return (
    <main className="min-h-screen bg-[#050505] px-3 py-5 text-white sm:px-4 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[1.8rem] bg-white text-zinc-900 shadow-2xl sm:rounded-[2rem]">
          <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-green-950 p-5 text-white sm:p-7 lg:p-9">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-green-300">
                  Área de membros
                </p>

                <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                  Bem-vindo, {order.customerName}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                  Seu acesso ao produto{" "}
                  <strong className="text-white">{order.product.name}</strong>{" "}
                  está organizado abaixo com arquivos, módulos e bônus
                  disponíveis para download.
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs font-bold text-zinc-400">Status</p>
                    <p
                      className={
                        isPaid
                          ? "mt-1 font-black text-green-300"
                          : "mt-1 font-black text-yellow-300"
                      }
                    >
                      {isPaid ? "✅ Acesso liberado" : "⏳ Aguardando pagamento"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs font-bold text-zinc-400">Compra</p>
                    <p className="mt-1 font-black text-white">{purchaseDate}</p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
                    <p className="text-xs font-bold text-zinc-400">Arquivos</p>
                    <p className="mt-1 font-black text-white">
                      {order.product.files.length} item(ns)
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 text-zinc-900 shadow-xl">
                {order.product.imageUrl ? (
                  <img
                    src={order.product.imageUrl}
                    alt={order.product.name}
                    className="h-64 w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
                    Sem capa cadastrada
                  </div>
                )}

                <h2 className="mt-4 text-2xl font-black">
                  {order.product.name}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {order.product.description ||
                    "Produto digital liberado após confirmação de pagamento."}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {!isPaid && (
              <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5 text-yellow-800">
                <p className="text-xl font-black">⏳ Pagamento pendente</p>
                <p className="mt-2 text-sm font-bold leading-relaxed">
                  Seus arquivos serão liberados automaticamente após a
                  confirmação do pagamento.
                </p>
              </div>
            )}

            {isPaid && (
              <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
                <aside className="space-y-4">
                  <div className="rounded-3xl border border-green-200 bg-green-50 p-5">
                    <p className="text-xl font-black text-green-700">
                      ✅ Pagamento aprovado
                    </p>

                    <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                      Seu acesso foi liberado com sucesso. Recomendamos baixar
                      todos os arquivos e salvar em local seguro.
                    </p>
                  </div>

                  <div className="rounded-3xl bg-zinc-950 p-5 text-white">
                    <p className="text-sm font-bold text-green-400">
                      Seu acesso
                    </p>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-3 border-b border-zinc-800 pb-3">
                        <span className="text-zinc-400">Produto</span>
                        <strong className="text-right">{order.product.name}</strong>
                      </div>

                      <div className="flex justify-between gap-3 border-b border-zinc-800 pb-3">
                        <span className="text-zinc-400">Pedido</span>
                        <strong className="text-right text-xs">{order.id}</strong>
                      </div>

                      <div className="flex justify-between gap-3">
                        <span className="text-zinc-400">Cliente</span>
                        <strong className="text-right">{order.customerEmail}</strong>
                      </div>
                    </div>
                  </div>
                </aside>

                <section className="space-y-5">
                  <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.18em] text-green-700">
                          Conteúdo liberado
                        </p>
                        <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                          Módulos e downloads
                        </h2>
                      </div>

                      <p className="rounded-full bg-green-600 px-4 py-2 text-sm font-black text-white">
                        {order.product.files.length} arquivo(s)
                      </p>
                    </div>
                  </div>

                  {principalFiles.length > 0 && (
                    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                      <h3 className="text-xl font-black">
                        📦 Produto principal
                      </h3>

                      <div className="mt-4 space-y-3">
                        {principalFiles.map((file, index) => (
                          <div
                            key={file.id}
                            className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
                                {getFileCategory(index)}
                              </p>

                              <p className="mt-1 font-black text-zinc-900">
                                {file.title}
                              </p>

                              {file.description && (
                                <p className="mt-1 text-sm text-zinc-500">
                                  {file.description}
                                </p>
                              )}
                            </div>

                            <a
                              href={file.fileUrl}
                              download
                              className="rounded-xl bg-green-600 px-5 py-3 text-center font-black text-white hover:bg-green-700"
                            >
                              Baixar arquivo
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {moduleFiles.length > 0 && (
                    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                      <h3 className="text-xl font-black">📚 Módulos</h3>

                      <div className="mt-4 grid gap-3">
                        {moduleFiles.map((file, index) => (
                          <div
                            key={file.id}
                            className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-purple-700">
                                Módulo {index + 1}
                              </p>

                              <p className="mt-1 font-black text-zinc-900">
                                {file.title}
                              </p>

                              {file.description && (
                                <p className="mt-1 text-sm text-zinc-500">
                                  {file.description}
                                </p>
                              )}
                            </div>

                            <a
                              href={file.fileUrl}
                              download
                              className="rounded-xl bg-zinc-900 px-5 py-3 text-center font-black text-white hover:bg-zinc-800"
                            >
                              Acessar download
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bonusFiles.length > 0 && (
                    <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
                      <h3 className="text-xl font-black text-yellow-950">
                        🎁 Bônus
                      </h3>

                      <div className="mt-4 grid gap-3">
                        {bonusFiles.map((file, index) => (
                          <div
                            key={file.id}
                            className="flex flex-col gap-4 rounded-2xl border border-yellow-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
                          >
                            <div>
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-700">
                                Bônus {index + 1}
                              </p>

                              <p className="mt-1 font-black text-zinc-900">
                                {file.title}
                              </p>

                              {file.description && (
                                <p className="mt-1 text-sm text-zinc-500">
                                  {file.description}
                                </p>
                              )}
                            </div>

                            <a
                              href={file.fileUrl}
                              download
                              className="rounded-xl bg-yellow-500 px-5 py-3 text-center font-black text-zinc-950 hover:bg-yellow-400"
                            >
                              Baixar bônus
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.product.files.length === 0 && (
                    <div className="rounded-3xl bg-zinc-100 p-5 text-zinc-600">
                      Nenhum arquivo cadastrado para este produto.
                    </div>
                  )}
                </section>
              </div>
            )}

            {showUpsell && upsellProduct && (
              <div className="mt-8 overflow-hidden rounded-[2rem] border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-green-50 p-4 shadow-xl sm:p-6 lg:p-7">
                <div className="text-center">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-700 sm:text-sm">
                    🎁 Oferta exclusiva para alunos
                  </p>

                  <h2 className="mx-auto mt-3 max-w-3xl text-2xl font-black leading-tight tracking-tight text-purple-950 sm:text-3xl lg:text-4xl">
                    Complete seu acesso com este material complementar
                  </h2>

                  <div className="mt-4">
                    <LiveViewerBadge />
                  </div>

                  <p className="mx-auto mt-4 max-w-2xl rounded-2xl bg-white/70 p-3 text-xs font-bold leading-relaxed text-purple-800 shadow-sm sm:text-sm">
                    ⚠️ Esta oferta pode não aparecer novamente depois que você
                    sair desta página.
                  </p>
                </div>

                <div className="mt-6 grid gap-5 rounded-[1.7rem] bg-white p-4 shadow-lg sm:p-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                  {upsellProduct.imageUrl ? (
                    <img
                      src={upsellProduct.imageUrl}
                      alt={upsellProduct.name}
                      className="max-h-72 w-full rounded-3xl bg-black object-contain shadow-md sm:max-h-80 lg:max-h-96"
                    />
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center rounded-3xl bg-zinc-100 text-zinc-400 sm:h-64">
                      Sem capa cadastrada
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-green-700 sm:text-sm">
                      Adicione agora
                    </p>

                    <h3 className="mt-2 text-2xl font-black leading-tight text-zinc-950 sm:text-3xl lg:text-4xl">
                      {upsellProduct.name}
                    </h3>

                    {upsellHeadline && (
                      <p className="mt-3 rounded-2xl bg-purple-50 p-4 text-sm font-bold leading-relaxed text-purple-900 sm:text-base">
                        {upsellHeadline}
                      </p>
                    )}

                    {upsellBenefits.length > 0 && (
                      <div className="mt-4 rounded-3xl border border-purple-100 bg-white p-4 shadow-sm sm:p-5">
                        <p className="mb-3 text-sm font-black text-purple-950 sm:text-base">
                          Tudo que você vai aprender:
                        </p>

                        <ul className="grid gap-2 sm:grid-cols-2">
                          {upsellBenefits.slice(0, 16).map((benefit, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-3 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-white p-3 text-sm font-bold leading-snug text-purple-950 shadow-sm"
                            >
                              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-xs font-black text-white shadow-sm">
                                ✓
                              </span>
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-5 rounded-3xl bg-zinc-950 p-5 text-center text-white">
                      <p className="text-sm font-bold text-zinc-400">
                        De{" "}
                        <span className="text-zinc-500 line-through">
                          {formatCurrency(oldUpsellPrice)}
                        </span>
                      </p>

                      <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-green-300 sm:text-sm">
                        por apenas
                      </p>

                      <p className="mt-1 text-4xl font-black text-green-400 sm:text-5xl">
                        {formatCurrency(upsellProduct.price)}
                      </p>
                    </div>

                    <a
                      href={`/upsell/${order.id}`}
                      className="mt-5 block rounded-2xl bg-purple-700 p-5 text-center text-base font-black text-white shadow-lg shadow-purple-200 transition hover:bg-purple-800 sm:text-lg"
                    >
                      🚀 ADICIONAR À MINHA COMPRA
                    </a>

                    <p className="mt-3 text-center text-xs font-bold text-purple-700 sm:text-sm">
                      Oferta opcional. Será gerado um novo PIX separado.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
