type SendDownloadEmailInput = {
  to: string;
  customerName: string;
  productName: string;
  downloadUrl: string;
};

export async function sendDownloadEmail({
  to,
  customerName,
  productName,
  downloadUrl,
}: SendDownloadEmailInput) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.EMAIL_FROM || "Checkout Digital <onboarding@resend.dev>";

  if (!resendApiKey) {
    console.log("RESEND_API_KEY não configurado. E-mail não enviado.");
    return {
      skipped: true,
      reason: "RESEND_API_KEY não configurado.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject: `Seu acesso foi liberado: ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f4f4f5; padding: 32px;">
          <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 28px;">
            <h1 style="color: #111827; margin-bottom: 12px;">Pagamento aprovado ✅</h1>

            <p style="color: #374151; font-size: 16px;">
              Olá, <strong>${customerName}</strong>.
            </p>

            <p style="color: #374151; font-size: 16px;">
              Seu acesso ao produto <strong>${productName}</strong> foi liberado.
            </p>

            <a
              href="${downloadUrl}"
              style="display: inline-block; margin-top: 18px; background: #16a34a; color: #ffffff; padding: 14px 22px; border-radius: 12px; text-decoration: none; font-weight: bold;"
            >
              Acessar área de download
            </a>

            <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">
              Se o botão não funcionar, copie e cole este link no navegador:
            </p>

            <p style="word-break: break-all; color: #111827; font-size: 13px;">
              ${downloadUrl}
            </p>

            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

            <p style="color: #6b7280; font-size: 12px;">
              Este e-mail foi enviado automaticamente após a confirmação do pagamento.
            </p>
          </div>
        </div>
      `,
      text: `Olá, ${customerName}. Seu acesso ao produto ${productName} foi liberado. Acesse: ${downloadUrl}`,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Erro ao enviar e-mail:", data);
    return {
      ok: false,
      data,
    };
  }

  console.log("E-mail de acesso enviado:", data);

  return {
    ok: true,
    data,
  };
}
