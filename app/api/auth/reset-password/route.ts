import { NextResponse } from "next/server";
import {
  attachSessionCookie,
  createAdminSession,
  hashPassword,
  hashToken,
} from "@/app/lib/adminAuth";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.token || !body.password) {
      return NextResponse.json(
        { error: "Token e nova senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (String(body.password).length < 8) {
      return NextResponse.json(
        { error: "A senha precisa ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(body.token);

    const admin = await prisma.adminUser.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Token inválido ou expirado." },
        { status: 400 }
      );
    }

    const { passwordHash, passwordSalt } = hashPassword(body.password);

    const updatedAdmin = await prisma.adminUser.update({
      where: {
        id: admin.id,
      },
      data: {
        passwordHash,
        passwordSalt,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
      },
    });

    await prisma.adminSession.deleteMany({
      where: {
        userId: updatedAdmin.id,
      },
    });

    const session = await createAdminSession(updatedAdmin.id);

    const response = NextResponse.json({
      ok: true,
      message: "Senha redefinida com sucesso.",
    });

    return attachSessionCookie(response, session.token, session.expiresAt);
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);

    return NextResponse.json(
      { error: "Erro ao redefinir senha." },
      { status: 500 }
    );
  }
}
