type SendLeadRecoveryEmailInput = {
  to: string;
  customerName: string;
  productName: string;
  checkoutUrl: string;
  step: 1 | 2 | 3;
};

function getRecoveryContent({
  customerName,
  productName,
  checkoutUrl,
  step,
}: Omit<SendLeadRecoveryEmailInput, "to">) {
  if (step === 1) {
    return {
      subject: "Sua compra ficou pendente",
      headline: "Sua compra ficou pendente",
      intro: `Olá, ${customerName}. Vi que você iniciou sua compra do produto ${productName}, mas ainda não concluiu.`,
      body: "Seu acesso ainda pode ser finalizado pelo link abaixo:",
      button: "Concluir minha compra",
    };
  }

  if (step === 2) {
    return {
      subject: "Ainda quer finalizar seu acesso?",
      headline: "Seu acesso ainda está disponível",
      intro: `Olá, ${customerName}. Sua compra do produto ${productName} ainda está pendente.`,
      body: "Clique abaixo para voltar ao checkout e concluir com segurança:",
      button: "Finalizar agora",
    };
  }

  return {
    subject: "Último lembrete sobre sua compra",
    headline: "Último lembrete",
    intro: `Olá, ${customerName}. Esta é uma última lembrança sobre o produto ${productName}.`,
    body: "Se ainda quiser garantir seu acesso, finalize pelo link abaixo:",
    button: "Garantir meu acesso",
  };
}

export async function sendLeadRecoveryEmail({
  to,
  customerName,
  productName,
  checkoutUrl,
  step,
}: SendLeadRecoveryEmailInput) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.EMAIL_FROM || "Checkout Digital <onboarding@resend.dev>";

  if (!resendApiKey) {
    console.log("RESEND_API_KEY não configurado. Recuperação não enviada.");
    return {
      skipped: true,
      reason: "RESEND_API_KEY não configurado.",
    };
  }

  const content = getRecoveryContent({
    customerName,
    productName,
    checkoutUrl,
    step,
  });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject: content.subject,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f4f4f5; padding: 32px;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 28px;">
            <h1 style="color: #111827; margin-bottom: 12px;">${content.headline}</h1>

            <p style="color: #374151; font-size: 16px;">
              ${content.intro}
            </p>

            <p style="color: #374151; font-size: 16px;">
              ${content.body}
            </p>

            <a
              href="${checkoutUrl}"
              style="display: inline-block; margin-top: 18px; background: #16a34a; color: #ffffff; padding: 14px 22px; border-radius: 12px; text-decoration: none; font-weight: bold;"
            >
              ${content.button}
            </a>

            <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
              Se o botão não funcionar, copie e cole este link no navegador:
            </p>

            <p style="word-break: break-all; color: #111827; font-size: 13px;">
              ${checkoutUrl}
            </p>

            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

            <p style="color: #6b7280; font-size: 12px;">
              Esta mensagem foi enviada porque você iniciou o checkout e não concluiu o pagamento.
            </p>
          </div>
        </div>
      `,
      text: `${content.headline}\n\n${content.intro}\n\n${content.body}\n${checkoutUrl}`,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro ao enviar e-mail de recuperação:", data);

    return {
      ok: false,
      data,
    };
  }

  return {
    ok: true,
    data,
  };
}
