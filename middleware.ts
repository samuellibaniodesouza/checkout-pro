import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicAuthRoutes = ["/login", "/cadastro", "/recuperar-senha", "/redefinir-senha"];

const protectedApiPrefixes = [
  "/api/payment-settings",
  "/api/integration-settings",
  "/api/system",
  "/api/coupons",
  "/api/email-templates",
  "/api/app-settings",
  "/api/settings",
  "/api/leads",
  "/api/expenses",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get("admin_session")?.value);

  if (pathname.startsWith("/painel") && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (
    protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix)) &&
    !hasSession
  ) {
    return NextResponse.json(
      { error: "Não autorizado. Faça login." },
      { status: 401 }
    );
  }

  if (hasSession && publicAuthRoutes.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/painel";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/painel/:path*", "/api/:path*", "/login", "/cadastro", "/recuperar-senha", "/redefinir-senha"],
};
