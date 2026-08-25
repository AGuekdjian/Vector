import { NextResponse } from "next/server";
const SESSION_COOKIE = "vector_session";
export function proxy(request) {
  if (!request.cookies.has(SESSION_COOKIE))
    return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/orders/:path*",
    "/administration/:path*",
    "/employees/:path*",
    "/users/:path*",
    "/vehicles/:path*",
    "/audit/:path*",
    "/technician/:path*",
  ],
};
