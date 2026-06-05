import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

const SESSION_COOKIE = "admin_session";
const SESSION_DAYS = 7;

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const passwordHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return {
    passwordHash,
    passwordSalt: salt,
  };
}

export function verifyPassword({
  password,
  passwordHash,
  passwordSalt,
}: {
  password: string;
  passwordHash: string;
  passwordSalt: string;
}) {
  const generated = hashPassword(password, passwordSalt);

  return crypto.timingSafeEqual(
    Buffer.from(generated.passwordHash, "hex"),
    Buffer.from(passwordHash, "hex")
  );
}

export function hashToken(token: string) {
  return hash(token);
}

export async function hasAdminUser() {
  const count = await prisma.adminUser.count();

  return count > 0;
}

export async function createAdminSession(userId: string) {
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

  await prisma.adminSession.create({
    data: {
      tokenHash,
      expiresAt,
      userId,
    },
  });

  return {
    token,
    expiresAt,
  };
}

export function attachSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date
) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function getAdminFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.adminSession.findUnique({
    where: {
      tokenHash: hashToken(token),
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await prisma.adminSession.delete({
      where: {
        id: session.id,
      },
    });

    return null;
  }

  return session.user;
}

export async function requireAdmin() {
  const admin = await getAdminFromSession();

  if (!admin) {
    return NextResponse.json(
      {
        error: "Não autorizado. Faça login novamente.",
      },
      { status: 401 }
    );
  }

  return null;
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return;

  await prisma.adminSession.deleteMany({
    where: {
      tokenHash: hashToken(token),
    },
  });
}
