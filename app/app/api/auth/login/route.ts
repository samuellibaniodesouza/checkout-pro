import { NextResponse } from "next/server";
import {
  attachSessionCookie,
  createAdminSession,
  verifyPassword,
} from "@/app/lib/adminAuth";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const admin = await prisma.adminUser.findUnique({
      where: {
        email: String(body.email).trim().toLowerCase(),
      },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

    const validPassword = verifyPassword({
      password: body.password,
      passwordHash: admin.passwordHash,
      passwordSalt: admin.passwordSalt,
    });

    if (!validPassword) {
      return NextResponse.json(
        { error: "E-mail ou senha inválidos." },
        { status: 401 }
      );
    }

    const session = await createAdminSession(admin.id);

    const response = NextResponse.json({
      ok: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });

    return attachSessionCookie(response, session.token, session.expiresAt);
  } catch (error) {
    console.error("Erro ao fazer login:", error);

    return NextResponse.json(
      { error: "Erro ao fazer login." },
      { status: 500 }
    );
  }
}
