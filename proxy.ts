import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase-server";

const publicRoutes = ["/", "/login", "/signup", "/auth/confirm", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon|api).*)"],
};
