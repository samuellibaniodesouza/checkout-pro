"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type UpsellProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  upsellHeadline: string | null;
  upsellBenefits: string | null;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  metaPixelId: string | null;
  upsellEnabled: boolean;
  upsellProductId: string | null;
  upsellProduct: UpsellProduct | null;
};

type CheckoutSettings = {
  checkoutTitle: string;
  checkoutSubtitle: string;
  checkoutButtonText: string;
  checkoutGuaranteeText: string;
  primaryColor: string;
  secondaryColor: string;

  orderBumpEnabled: boolean;
  orderBumpName: string;
  orderBumpDescription: string;
  orderBumpPrice: number;
  orderBumpOldPrice: number;
  orderBumpBadge: string;
  orderBumpButtonText: string;
  orderBumpBenefits: string;
};

type CheckoutClientProps = {
  product: Product;
};

type MetaFbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  loaded?: boolean;
  version?: string;
  push?: MetaFbq;
};

type MetaWindow = Window & {
  fbq?: MetaFbq;
  _fbq?: MetaFbq;
};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    MercadoPago?: new (publicKey: string, options?: Record<string, unknown>) => {
      createCardToken: (cardData: Record<string, string>) => Promise<{ id?: string; error?: unknown; message?: string }>;
    };
  }
}

const CREDIT_CARD_METHODS = [
  { value: "visa", label: "Visa" },
  { value: "master", label: "Mastercard" },
  { value: "amex", label: "American Express" },
  { value: "elo", label: "Elo" },
  { value: "hipercard", label: "Hipercard" },
];

const DEBIT_CARD_METHODS = [
  { value: "debvisa", label: "Visa Débito" },
  { value: "debmaster", label: "Mastercard Débito" },
  { value: "debelo", label: "Elo Débito" },
];

const defaultSettings: CheckoutSettings = {
  checkoutTitle: "Finalize sua compra com segurança",
  checkoutSubtitle: "Produto digital com acesso após confirmação do pagamento.",
  checkoutButtonText: "Comprar agora com segurança",
  checkoutGuaranteeText:
    "Seus dados estão protegidos. Não armazenamos dados de cartão.",
  primaryColor: "#16a34a",
  secondaryColor: "#7e22ce",

  orderBumpEnabled: true,
  orderBumpName: "Kit Fornecedores Premium",
  orderBumpDescription:
    "Receba uma lista prática com fornecedores, ideias de compra de matéria-prima e caminhos para começar vendendo mais rápido.",
  orderBumpPrice: 9.9,
  orderBumpOldPrice: 19.9,
  orderBumpBadge: "Oferta rápida",
  orderBumpButtonText: "adicionar ao pedido",
  orderBumpBenefits:
    "Lista de fornecedores\nMatérias-primas\nIdeias para revenda\nAcesso imediato",
};


function installMetaPixel(pixelId: string) {
  if (!pixelId) return false;

  const metaWindow = window as MetaWindow;

  if (!metaWindow.fbq) {
    const fbq = (function (...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
        return;
      }

      fbq.queue.push(args);
    }) as MetaFbq;

    fbq.queue = [];
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";

    metaWindow.fbq = fbq;
    metaWindow._fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";

    const firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode?.insertBefore(script, firstScript);
  }

  metaWindow.fbq?.("init", pixelId);
  return true;
}

function loadMercadoPagoSdk() {
  return new Promise<void>((resolve, reject) => {
    if (window.MercadoPago) {
      resolve();
      return;
    }

    const currentScript = document.querySelector(
      'script[src="https://sdk.mercadopago.com/js/v2"]'
    );

    if (currentScript) {
      currentScript.addEventListener("load", () => resolve(), { once: true });
      currentScript.addEventListener("error", () => reject(new Error("Erro ao carregar MercadoPago.js")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Erro ao carregar MercadoPago.js"));
    document.body.appendChild(script);
  });
}

async function getMercadoPagoPublicKey() {
  const response = await fetch("/api/public/mercado-pago-key");
  const data = await response.json();

  if (!response.ok || !data.publicKey) {
    throw new Error(data.error || "Public Key do Mercado Pago não encontrada.");
  }

  return String(data.publicKey);
}

function getFriendlyCardTokenError(error: unknown) {
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === "object" && error !== null) {
    const item = error as {
      message?: string;
      error?: string;
      cause?: Array<{ description?: string; message?: string; code?: string }>;
    };

    const cause = item.cause
      ?.map((causeItem) => causeItem.description || causeItem.message || causeItem.code)
      .filter(Boolean)
      .join(" | ");

    return cause || item.message || item.error || "Erro desconhecido ao gerar token do cartão.";
  }

  return "Erro desconhecido ao gerar token do cartão.";
}

async function createCardTokenByRestApi(publicKey: string, card: {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
  customerCpf: string;
}) {
  const response = await fetch(
    `https://api.mercadopago.com/v1/card_tokens?public_key=${encodeURIComponent(publicKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        card_number: card.cardNumber.replace(/\D/g, ""),
        expiration_month: Number(card.expirationMonth),
        expiration_year: Number(
          card.expirationYear.length === 2 ? `20${card.expirationYear}` : card.expirationYear
        ),
        security_code: card.securityCode,
        cardholder: {
          name: card.cardholderName,
          identification: {
            type: "CPF",
            number: card.customerCpf.replace(/\D/g, ""),
          },
        },
      }),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.id) {
    console.error("Erro REST token Mercado Pago:", data);
    throw new Error(
      data?.message ||
        data?.error ||
        "Não foi possível gerar o token seguro do cartão. Confira número, validade, CVV, CPF e Public Key."
    );
  }

  return String(data.id);
}

async function createMercadoPagoCardToken(card: {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
  customerCpf: string;
}) {
  const publicKey = await getMercadoPagoPublicKey();

  try {
    await loadMercadoPagoSdk();

    if (!window.MercadoPago) {
      throw new Error("MercadoPago.js não carregou corretamente.");
    }

    const mercadoPago = new window.MercadoPago(publicKey, { locale: "pt-BR" });

    const token = await mercadoPago.createCardToken({
      cardNumber: card.cardNumber.replace(/\D/g, ""),
      cardholderName: card.cardholderName,
      cardExpirationMonth: card.expirationMonth.padStart(2, "0"),
      cardExpirationYear:
        card.expirationYear.length === 2 ? `20${card.expirationYear}` : card.expirationYear,
      securityCode: card.securityCode,
      identificationType: "CPF",
      identificationNumber: card.customerCpf.replace(/\D/g, ""),
    });

    if (token.id) {
      return token.id;
    }

    console.error("MercadoPago.js não retornou token:", token);
    throw new Error(
      token.message ||
        getFriendlyCardTokenError(token.error) ||
        "MercadoPago.js não retornou o token seguro do cartão."
    );
  } catch (error) {
    console.error("Falha ao gerar token pelo SDK MercadoPago.js. Tentando fallback REST:", error);
    return createCardTokenByRestApi(publicKey, card);
  }
}

export default function CheckoutClient({ product }: CheckoutClientProps) {
  const router = useRouter();
  const pageViewSent = useRef(false);

  const [pixelId, setPixelId] = useState(product.metaPixelId || "");
  const [settings, setSettings] =
    useState<CheckoutSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [leadSaved, setLeadSaved] = useState(false);
  const [orderBump, setOrderBump] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");

  const orderBumpPrice = Number(settings.orderBumpPrice || 0);
  const orderBumpOldPrice = Number(settings.orderBumpOldPrice || 0);
  const canShowOrderBump = settings.orderBumpEnabled && orderBumpPrice > 0;
  const subtotal =
    product.price + (orderBump && canShowOrderBump ? orderBumpPrice : 0);
  const couponDiscount = appliedCoupon?.discount || 0;
  const total = Math.max(0, subtotal - couponDiscount);

  const orderBumpBenefits = settings.orderBumpBenefits
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerCpf: "",
    paymentMethod: "PIX",
    cardNumber: "",
    cardholderName: "",
    cardExpirationMonth: "",
    cardExpirationYear: "",
    cardSecurityCode: "",
    cardPaymentMethodId: "visa",
    installments: "1",
    boletoZipCode: "",
    boletoStreetName: "",
    boletoStreetNumber: "",
    boletoNeighborhood: "",
    boletoCity: "",
    boletoFederalUnit: "",
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();

        if (response.ok) {
          setSettings({
            ...defaultSettings,
            ...data,
            orderBumpPrice: Number(data.orderBumpPrice || defaultSettings.orderBumpPrice),
            orderBumpOldPrice: Number(
              data.orderBumpOldPrice || defaultSettings.orderBumpOldPrice
            ),
          });
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    }

    loadSettings();
  }, []);

  useEffect(() => {
    async function loadPixel() {
      let finalPixelId = product.metaPixelId || "";

      if (!finalPixelId) {
        try {
          const response = await fetch("/api/public/meta-pixel");
          const data = await response.json();

          if (response.ok && data.pixelId) {
            finalPixelId = data.pixelId;
          }
        } catch (error) {
          console.error("Erro ao buscar Pixel geral:", error);
        }
      }

      if (!finalPixelId) {
        console.warn("Meta Pixel não configurado para este checkout.");
        return;
      }

      setPixelId(finalPixelId);

      const installed = installMetaPixel(finalPixelId);

      if (installed && !pageViewSent.current && window.fbq) {
        pageViewSent.current = true;

        window.fbq("track", "PageView", {
          content_name: product.name,
          content_ids: [product.id],
          content_type: "product",
          value: product.price,
          currency: "BRL",
        });

        console.log("Meta Pixel PageView enviado:", finalPixelId);
      }
    }

    loadPixel();
  }, [product.id, product.name, product.price, product.metaPixelId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveLeadIfPossible();
    }, 900);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    form.customerName,
    form.customerEmail,
    form.customerPhone,
    form.customerCpf,
    leadSaved,
  ]);

  function updateForm(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function trackInitiateCheckout() {
    if (!pixelId || !window.fbq) {
      console.warn("InitiateCheckout não enviado: Pixel ausente.");
      return;
    }

    window.fbq("track", "InitiateCheckout", {
      content_name: product.name,
      content_ids: [product.id],
      content_type: "product",
      value: total,
      currency: "BRL",
    });

    console.log("Meta Pixel InitiateCheckout enviado:", pixelId);
  }

  async function saveLeadIfPossible() {
    if (leadSaved) {
      return;
    }

    if (
      !form.customerName.trim() ||
      !form.customerEmail.trim() ||
      !form.customerPhone.trim()
    ) {
      return;
    }

    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          customerCpf: form.customerCpf,
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          source: "checkout",
        }),
      });

      setLeadSaved(true);
    } catch (error) {
      console.error("Erro ao salvar lead:", error);
    }
  }

  async function applyCoupon() {
    setCouponMessage("");

    if (!couponCode.trim()) {
      setCouponMessage("Digite um cupom.");
      return;
    }

    setCouponLoading(true);

    const response = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: couponCode,
        amount: subtotal,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setAppliedCoupon({
        code: data.coupon.code,
        discount: Number(data.discount || 0),
      });
      setCouponCode(data.coupon.code);
      setCouponMessage("Cupom aplicado com sucesso.");
    } else {
      setAppliedCoupon(null);
      setCouponMessage(data.error || "Cupom inválido.");
    }

    setCouponLoading(false);
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    trackInitiateCheckout();

    const finalOrderBump = orderBump && canShowOrderBump;
    const productNameWithBump = finalOrderBump
      ? `${product.name} + ${settings.orderBumpName}`
      : product.name;

    const orderResponse = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        customerCpf: form.customerCpf,
        productId: product.id,
        productName: productNameWithBump,
        amount: total,
        paymentMethod: form.paymentMethod,
        orderBump: finalOrderBump,
        isUpsellOrder: false,
        parentOrderId: null,
        couponCode: appliedCoupon?.code || null,
        couponDiscount,
      }),
    });

    if (!orderResponse.ok) {
      setMessage("Erro ao criar pedido.");
      setLoading(false);
      return;
    }

    const orderData = await orderResponse.json();

    try {
      let cardToken: string | undefined;

      if (["CARTAO_CREDITO", "CARTAO_DEBITO"].includes(form.paymentMethod)) {
        cardToken = await createMercadoPagoCardToken({
          cardNumber: form.cardNumber,
          cardholderName: form.cardholderName || form.customerName,
          expirationMonth: form.cardExpirationMonth,
          expirationYear: form.cardExpirationYear,
          securityCode: form.cardSecurityCode,
          customerCpf: form.customerCpf,
        });
      }

      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod: form.paymentMethod,
          orderId: orderData.id,
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerCpf: form.customerCpf,
          productName: productNameWithBump,
          amount: total,
          cardToken,
          cardPaymentMethodId: form.cardPaymentMethodId,
          installments: form.installments,
          address: {
            zipCode: form.boletoZipCode,
            streetName: form.boletoStreetName,
            streetNumber: form.boletoStreetNumber,
            neighborhood: form.boletoNeighborhood,
            city: form.boletoCity,
            federalUnit: form.boletoFederalUnit,
          },
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        setMessage(paymentData.error || paymentData.details || "Pedido criado, mas houve erro ao gerar pagamento.");
        setLoading(false);
        return;
      }

      await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderData.id,
          gatewayPaymentId: String(paymentData.id),
        }),
      });

      const hasUpsell = product.upsellEnabled && product.upsellProduct;

      const checkoutPayment = {
        type: paymentData.type || form.paymentMethod,
        status: paymentData.status,
        statusDetail: paymentData.statusDetail,
        orderId: orderData.id,
        paymentId: paymentData.id,
        qrCode: paymentData.qrCode || null,
        qrCodeBase64: paymentData.qrCodeBase64 || null,
        ticketUrl: paymentData.ticketUrl || null,
        barcode: paymentData.barcode || null,
        amount: total,
        productName: productNameWithBump,
        downloadUrl: `/area-de-download/${orderData.id}`,
        orderBump: finalOrderBump,
        orderBumpName: finalOrderBump ? settings.orderBumpName : null,
        orderBumpPrice: finalOrderBump ? orderBumpPrice : null,
        couponCode: appliedCoupon?.code || null,
        couponDiscount,
        upsellUrl: hasUpsell ? `/upsell/${orderData.id}` : null,
        upsellProductName: hasUpsell ? product.upsellProduct?.name : null,
        upsellProductPrice: hasUpsell ? product.upsellProduct?.price : null,
        upsellImageUrl: hasUpsell ? product.upsellProduct?.imageUrl : null,
        upsellHeadline: hasUpsell ? product.upsellProduct?.upsellHeadline : null,
        upsellBenefits: hasUpsell ? product.upsellProduct?.upsellBenefits : null,
      };

      localStorage.setItem("checkoutPayment", JSON.stringify(checkoutPayment));
      localStorage.setItem("checkoutPix", JSON.stringify(checkoutPayment));
    } catch (error) {
      console.error("Erro no fluxo de pagamento do checkout:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "Erro ao processar pagamento. Abra o Console/Network para ver o detalhe."
      );
      setLoading(false);
      return;
    }

    router.push("/obrigado");
  }

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl bg-white p-6 text-zinc-900 shadow-2xl">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="mb-6 h-72 w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="mb-6 flex h-72 w-full items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
              Sem capa cadastrada
            </div>
          )}

          <p className="text-sm font-bold text-green-700">🔒 Checkout seguro</p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {settings.checkoutTitle}
          </h1>

          <p className="mt-2 text-xl font-black text-zinc-900">
            {product.name}
          </p>

          <p className="mt-4 text-zinc-600">
            {settings.checkoutSubtitle ||
              product.description ||
              "Produto digital com acesso após confirmação do pagamento."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              required
              className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
              placeholder="Nome completo"
              value={form.customerName}
              onChange={(event) =>
                updateForm("customerName", event.target.value)
              }
            />

            <input
              required
              type="email"
              className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
              placeholder="E-mail"
              value={form.customerEmail}
              onChange={(event) =>
                updateForm("customerEmail", event.target.value)
              }
            />

            <input
              required
              className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
              placeholder="Telefone"
              value={form.customerPhone}
              onChange={(event) =>
                updateForm("customerPhone", event.target.value)
              }
            />

            <input
              required
              className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
              placeholder="CPF"
              value={form.customerCpf}
              onChange={(event) =>
                updateForm("customerCpf", event.target.value)
              }
            />

            <select
              className="w-full rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
              value={form.paymentMethod}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  paymentMethod: event.target.value,
                  cardPaymentMethodId:
                    event.target.value === "CARTAO_DEBITO" ? "debvisa" : "visa",
                }))
              }
            >
              <option value="PIX">PIX — aprovação rápida</option>
              <option value="CARTAO_CREDITO">Cartão de crédito</option>
              <option value="CARTAO_DEBITO">Cartão de débito</option>
              <option value="BOLETO">Boleto bancário</option>
            </select>

            {["CARTAO_CREDITO", "CARTAO_DEBITO"].includes(form.paymentMethod) && (
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-3 text-sm font-black text-zinc-900">Dados do cartão</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    inputMode="numeric"
                    className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600 sm:col-span-2"
                    placeholder="Número do cartão"
                    value={form.cardNumber}
                    onChange={(event) => updateForm("cardNumber", event.target.value)}
                  />

                  <input
                    required
                    className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600 sm:col-span-2"
                    placeholder="Nome impresso no cartão"
                    value={form.cardholderName}
                    onChange={(event) => updateForm("cardholderName", event.target.value)}
                  />

                  <input
                    required
                    inputMode="numeric"
                    maxLength={2}
                    className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    placeholder="Mês MM"
                    value={form.cardExpirationMonth}
                    onChange={(event) => updateForm("cardExpirationMonth", event.target.value)}
                  />

                  <input
                    required
                    inputMode="numeric"
                    maxLength={4}
                    className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    placeholder="Ano AAAA"
                    value={form.cardExpirationYear}
                    onChange={(event) => updateForm("cardExpirationYear", event.target.value)}
                  />

                  <input
                    required
                    inputMode="numeric"
                    maxLength={4}
                    className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    placeholder="CVV"
                    value={form.cardSecurityCode}
                    onChange={(event) => updateForm("cardSecurityCode", event.target.value)}
                  />

                  <select
                    required
                    className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600"
                    value={form.cardPaymentMethodId}
                    onChange={(event) => updateForm("cardPaymentMethodId", event.target.value)}
                  >
                    {(form.paymentMethod === "CARTAO_DEBITO" ? DEBIT_CARD_METHODS : CREDIT_CARD_METHODS).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  {form.paymentMethod === "CARTAO_CREDITO" && (
                    <select
                      className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600 sm:col-span-2"
                      value={form.installments}
                      onChange={(event) => updateForm("installments", event.target.value)}
                    >
                      <option value="1">1x sem parcelas</option>
                      <option value="2">2x</option>
                      <option value="3">3x</option>
                      <option value="4">4x</option>
                      <option value="5">5x</option>
                      <option value="6">6x</option>
                    </select>
                  )}
                </div>

                <p className="mt-3 text-xs font-bold text-zinc-500">
                  O token seguro é criado pela MercadoPago.js. O sistema não salva dados do cartão.
                </p>
              </div>
            )}

            {form.paymentMethod === "BOLETO" && (
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="mb-3 text-sm font-black text-zinc-900">Endereço para emissão do boleto</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input required className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600" placeholder="CEP" value={form.boletoZipCode} onChange={(event) => updateForm("boletoZipCode", event.target.value)} />
                  <input required className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600" placeholder="UF" maxLength={2} value={form.boletoFederalUnit} onChange={(event) => updateForm("boletoFederalUnit", event.target.value.toUpperCase())} />
                  <input required className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600 sm:col-span-2" placeholder="Rua" value={form.boletoStreetName} onChange={(event) => updateForm("boletoStreetName", event.target.value)} />
                  <input required className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600" placeholder="Número" value={form.boletoStreetNumber} onChange={(event) => updateForm("boletoStreetNumber", event.target.value)} />
                  <input required className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600" placeholder="Bairro" value={form.boletoNeighborhood} onChange={(event) => updateForm("boletoNeighborhood", event.target.value)} />
                  <input required className="rounded-xl border border-zinc-300 p-4 outline-none focus:border-green-600 sm:col-span-2" placeholder="Cidade" value={form.boletoCity} onChange={(event) => updateForm("boletoCity", event.target.value)} />
                </div>
              </div>
            )}

            {canShowOrderBump && (
              <button
                type="button"
                onClick={() => setOrderBump((prev) => !prev)}
                className={
                  orderBump
                    ? "w-full rounded-3xl border-2 border-green-500 bg-green-50 p-4 text-left shadow-lg shadow-green-100"
                    : "w-full rounded-3xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-4 text-left hover:border-green-400 hover:bg-green-50"
                }
              >
                <div className="flex items-start gap-3">
                  <div
                    className={
                      orderBump
                        ? "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-600 text-sm font-black text-white"
                        : "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-zinc-300 bg-white text-sm font-black text-zinc-400"
                    }
                  >
                    {orderBump ? "✓" : "+"}
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-green-700">
                      {settings.orderBumpBadge}
                    </p>

                    <h3 className="mt-1 text-lg font-black text-zinc-950">
                      Adicionar {settings.orderBumpName}
                    </h3>

                    <p className="mt-2 text-sm font-bold leading-relaxed text-zinc-600">
                      {settings.orderBumpDescription}
                    </p>

                    {orderBumpBenefits.length > 0 && (
                      <ul className="mt-3 grid gap-2 text-sm font-bold text-zinc-800 sm:grid-cols-2">
                        {orderBumpBenefits.slice(0, 8).map((benefit, index) => (
                          <li key={index}>✅ {benefit}</li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4 flex flex-wrap items-end gap-2">
                      {orderBumpOldPrice > orderBumpPrice && (
                        <span className="text-sm font-bold text-zinc-400 line-through">
                          R$ {orderBumpOldPrice.toFixed(2).replace(".", ",")}
                        </span>
                      )}

                      <span className="text-2xl font-black text-green-600">
                        R$ {orderBumpPrice.toFixed(2).replace(".", ",")}
                      </span>

                      <span className="rounded-full bg-green-600 px-3 py-1 text-xs font-black text-white">
                        {settings.orderBumpButtonText}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )}


            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
              <label className="mb-2 block text-sm font-black text-zinc-900">
                Cupom de desconto
              </label>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="w-full rounded-xl border border-zinc-300 p-4 font-black uppercase outline-none focus:border-green-600"
                  placeholder="DESCONTO10"
                  value={couponCode}
                  onChange={(event) =>
                    setCouponCode(
                      event.target.value.toUpperCase().replace(/\s+/g, "")
                    )
                  }
                  disabled={Boolean(appliedCoupon)}
                />

                {appliedCoupon ? (
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="rounded-xl bg-red-600 px-5 py-3 font-black text-white hover:bg-red-700"
                  >
                    Remover
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={couponLoading}
                    className="rounded-xl bg-zinc-900 px-5 py-3 font-black text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {couponLoading ? "Aplicando..." : "Aplicar"}
                  </button>
                )}
              </div>

              {couponMessage && (
                <p
                  className={
                    appliedCoupon
                      ? "mt-2 text-sm font-bold text-green-700"
                      : "mt-2 text-sm font-bold text-red-700"
                  }
                >
                  {couponMessage}
                </p>
              )}
            </div>

            {message && (
              <p className="rounded-xl bg-red-100 p-3 text-center text-sm font-bold text-red-700">
                {message}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl p-4 text-lg font-black text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: settings.primaryColor,
              }}
            >
              {loading ? "Gerando pagamento..." : settings.checkoutButtonText}
            </button>

            <p className="text-center text-xs text-zinc-500">
              {settings.checkoutGuaranteeText}
            </p>
          </form>
        </section>

        <aside className="rounded-3xl bg-zinc-900 p-6 shadow-2xl">
          <p className="text-sm font-bold text-green-400">Resumo do pedido</p>

          <div className="mt-6 space-y-4">
            <div className="flex justify-between border-b border-zinc-800 pb-4">
              <span>{product.name}</span>
              <strong>R$ {product.price.toFixed(2).replace(".", ",")}</strong>
            </div>

            {orderBump && canShowOrderBump && (
              <div className="flex justify-between border-b border-zinc-800 pb-4">
                <span>{settings.orderBumpName}</span>
                <strong>
                  R$ {orderBumpPrice.toFixed(2).replace(".", ",")}
                </strong>
              </div>
            )}

            {appliedCoupon && (
              <div className="flex justify-between border-b border-zinc-800 pb-4 text-green-300">
                <span>Desconto ({appliedCoupon.code})</span>
                <strong>
                  - R$ {couponDiscount.toFixed(2).replace(".", ",")}
                </strong>
              </div>
            )}

            <div className="flex justify-between border-t border-zinc-800 pt-4 text-xl">
              <span>Total</span>
              <strong className="text-green-400">
                R$ {total.toFixed(2).replace(".", ",")}
              </strong>
            </div>
          </div>

          {orderBump && canShowOrderBump && (
            <div className="mt-6 rounded-2xl bg-green-500/10 p-4 text-sm font-bold text-green-300">
              ✅ {settings.orderBumpName} adicionado ao pedido.
            </div>
          )}

          {product.upsellEnabled && product.upsellProduct && (
            <div className="mt-6 rounded-2xl bg-purple-500/10 p-4 text-sm text-purple-200">
              🎁 Oferta especial disponível após gerar o pedido:
              <br />
              <strong>{product.upsellProduct.name}</strong>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
