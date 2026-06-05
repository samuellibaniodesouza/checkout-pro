import { NextResponse } from "next/server";
import { generateToken, hashToken } from "@/app/lib/adminAuth";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.email) {
      return NextResponse.json(
        { error: "E-mail é obrigatório." },
        { status: 400 }
      );
    }

    const email = String(body.email).trim().toLowerCase();

    const admin = await prisma.adminUser.findUnique({
      where: {
        email,
      },
    });

    // Segurança: não revela se existe ou não.
    if (!admin) {
      return NextResponse.json({
        ok: true,
        message: "Se o e-mail existir, enviaremos instruções.",
      });
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    await prisma.adminUser.update({
      where: {
        id: admin.id,
      },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const resetUrl = `${siteUrl}/redefinir-senha?token=${token}`;

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail =
      process.env.EMAIL_FROM || "Checkout Digital <onboarding@resend.dev>";

    if (resendApiKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: admin.email,
          subject: "Redefinição de senha do painel",
          html: `
            <div style="font-family: Arial, sans-serif; background: #f4f4f5; padding: 32px;">
              <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 28px;">
                <h1 style="color: #111827;">Redefinir senha</h1>
                <p style="color: #374151;">Clique no botão abaixo para redefinir sua senha. O link expira em 30 minutos.</p>
                <a href="${resetUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:bold;">Redefinir senha</a>
                <p style="word-break: break-all; color: #6b7280; font-size: 13px; margin-top: 20px;">${resetUrl}</p>
              </div>
            </div>
          `,
          text: `Redefina sua senha: ${resetUrl}`,
        }),
      });
    } else {
      console.log("Link de recuperação de senha:", resetUrl);
    }

    return NextResponse.json({
      ok: true,
      message: "Se o e-mail existir, enviaremos instruções.",
      devResetUrl: process.env.NODE_ENV !== "production" ? resetUrl : undefined,
    });
  } catch (error) {
    console.error("Erro na recuperação de senha:", error);

    return NextResponse.json(
      { error: "Erro ao solicitar recuperação." },
      { status: 500 }
    );
  }
}
