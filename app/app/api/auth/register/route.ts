import { NextResponse } from "next/server";
import {
  attachSessionCookie,
  createAdminSession,
  hasAdminUser,
  hashPassword,
} from "@/app/lib/adminAuth";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const alreadyHasAdmin = await hasAdminUser();

    if (alreadyHasAdmin) {
      return NextResponse.json(
        { error: "O administrador principal já foi cadastrado." },
        { status: 403 }
      );
    }

    const body = await request.json();

    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    if (String(body.password).length < 8) {
      return NextResponse.json(
        { error: "A senha precisa ter pelo menos 8 caracteres." },
        { status: 400 }
      );
    }

    const { passwordHash, passwordSalt } = hashPassword(body.password);

    const admin = await prisma.adminUser.create({
      data: {
        name: body.name,
        email: String(body.email).trim().toLowerCase(),
        passwordHash,
        passwordSalt,
      },
    });

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
    console.error("Erro ao cadastrar admin:", error);

    return NextResponse.json(
      { error: "Erro ao cadastrar administrador." },
      { status: 500 }
    );
  }
}
