import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge gate for the admin area: requests without a session cookie are sent to
 * the login page. Full session validation and permission checks happen on the
 * server (requireUser / authorize) for every admin page and action.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!req.cookies.get("ent_session")) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
